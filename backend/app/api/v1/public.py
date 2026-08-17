import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
import jwt

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_candidate_session_token
from app.models.candidate import Candidate, Application
from app.models.drive import RecruitmentDrive
from app.models.assessment import Assessment, Question
from app.models.attempt import AssessmentAttempt, AttemptAnswer
from app.models.proctoring import ProctorSession, ProctorEvent

router = APIRouter(prefix="/public", tags=["Public Candidate Flow"])

class WhitelistCheckRequest(BaseModel):
    email: EmailStr

@router.post("/drive/{drive_id}/check-whitelist")
async def check_candidate_whitelist(
    drive_id: uuid.UUID,
    req: WhitelistCheckRequest,
    db: AsyncSession = Depends(get_db)
):
    cand_email = req.email.strip().lower()
    
    # 1. Check drive exists
    drive_stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id)
    drive_res = await db.execute(drive_stmt)
    drive = drive_res.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Recruitment drive not found")

    # 2. Query Candidate application in this drive
    cand_stmt = select(Candidate).where(Candidate.email == cand_email, Candidate.tenant_id == drive.tenant_id)
    cand_res = await db.execute(cand_stmt)
    cand = cand_res.scalar_one_or_none()

    if not cand:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not authorized for this recruitment drive. Please contact your recruiter to be added to the whitelist."
        )

    app_stmt = select(Application).where(Application.drive_id == drive.id, Application.candidate_id == cand.id)
    app_res = await db.execute(app_stmt)
    app = app_res.scalar_one_or_none()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not in the authorized candidate whitelist for this recruitment drive."
        )

    # 3. Check Single-Attempt Lock
    meta = dict(app.custom_field_values or {})
    if app.status in ["test_in_progress", "submitted", "l1_eligible", "l1_in_progress", "l1_rejected", "l2_eligible", "l2_in_progress", "l2_rejected", "selected", "test_rejected"] and meta.get("attempt_locked", True):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Assessment attempt already used. Please contact your recruiter to reactivate your session."
        )

    return {
        "whitelisted": True,
        "prefill": {
            "email": cand.email,
            "full_name": cand.full_name or meta.get("full_name", ""),
            "phone": cand.phone or meta.get("phone", ""),
            "experience_years": meta.get("experience_years", 0.0),
            "referral_source": meta.get("referral_source", "Excel Import")
        }
    }

class CandidateRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    experience_years: Optional[float] = 0.0
    referral_source: Optional[str] = "Direct"
    geolocation: Optional[Dict[str, Any]] = {}
    custom_fields: Optional[Dict[str, Any]] = {}

class AnswerSubmitRequest(BaseModel):
    answers: Dict[str, Any] # question_id -> submitted answer
    device_type: Optional[str] = "laptop" # laptop / mobile
    proctoring_telemetry: Optional[Dict[str, Any]] = {}

@router.get("/drive/{drive_id}")
async def get_public_drive_info(drive_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id)
    result = await db.execute(stmt)
    drive = result.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found or closed")

    return {
        "id": str(drive.id),
        "title": drive.title,
        "job_title": drive.job_title,
        "job_description": drive.job_description,
        "status": drive.status,
        "cutoff_percentage": drive.eligibility_rules.get("cutoff_percentage", 60.0),
        "proctoring_warning": "This assessment is proctored in full-screen mode. Leaving full-screen, minimizing window, or switching browser tabs will be recorded as a proctoring violation."
    }

@router.post("/drive/{drive_id}/register")
async def register_candidate(
    drive_id: uuid.UUID,
    req: CandidateRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id)
    res = await db.execute(stmt)
    drive = res.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    cand_email = req.email.strip().lower()

    # Strict Whitelist Check in DB
    cand_stmt = select(Candidate).where(Candidate.email == cand_email, Candidate.tenant_id == drive.tenant_id)
    cand_res = await db.execute(cand_stmt)
    candidate = cand_res.scalar_one_or_none()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not whitelisted for this drive. Access denied."
        )

    # Check if application already exists
    app_stmt = select(Application).where(Application.drive_id == drive.id, Application.candidate_id == candidate.id)
    app_res = await db.execute(app_stmt)
    app = app_res.scalar_one_or_none()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not whitelisted for this drive. Access denied."
        )

    meta = dict(app.custom_field_values or {})
    if app.status in ["test_in_progress", "submitted", "l1_eligible", "l1_in_progress", "l1_rejected", "l2_eligible", "l2_in_progress", "l2_rejected", "selected", "test_rejected"] and meta.get("attempt_locked", True):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Assessment attempt already used. Contact recruiter to reactivate."
        )

    profile_data = {
        "full_name": req.full_name,
        "email": req.email,
        "phone": req.phone,
        "experience_years": req.experience_years,
        "referral_source": req.referral_source,
        "geolocation": req.geolocation,
        "attempt_locked": True,
        **(req.custom_fields or {})
    }

    if not app:
        app = Application(
            tenant_id=drive.tenant_id,
            drive_id=drive.id,
            candidate_id=candidate.id,
            status="test_in_progress",
            invitation_token=f"tok_{uuid.uuid4().hex[:12]}",
            custom_field_values=profile_data
        )
        db.add(app)
        await db.flush()
    else:
        app.status = "test_in_progress"
        app.custom_field_values = profile_data

    # Fetch assessment paper
    assess_stmt = select(Assessment).where(Assessment.drive_id == drive.id)
    assess_res = await db.execute(assess_stmt)
    assessment = assess_res.scalar_one_or_none()

    # Create attempt
    attempt = AssessmentAttempt(
        application_id=app.id,
        assessment_id=assessment.id if assessment else drive.id,
        paper_version="A",
        status="in_progress",
        device_binding_meta={"registered_name": req.full_name, "geolocation": req.geolocation}
    )
    db.add(attempt)
    await db.flush()

    proctor = ProctorSession(attempt_id=attempt.id, risk_level="normal")
    db.add(proctor)
    await db.commit()

    token = create_candidate_session_token(
        application_id=str(app.id),
        tenant_id=str(drive.tenant_id),
        attempt_id=str(attempt.id),
        duration_minutes=int(assessment.duration_minutes if assessment else 45)
    )

    questions_clean = []
    if assessment and assessment.paper_versions:
        raw_questions = assessment.paper_versions.get("A", [])
        for q in raw_questions:
            # Strip answer keys before sending to candidate!
            questions_clean.append({
                "id": q.get("id"),
                "title": q.get("title"),
                "question_type": q.get("question_type", "single_mcq"),
                "options": q.get("options", []),
                "marks": q.get("marks", 1.0),
                "boilerplate": q.get("boilerplate")
            })

    return {
        "session_token": token,
        "attempt_id": str(attempt.id),
        "application_id": str(app.id),
        "duration_minutes": assessment.duration_minutes if assessment else 45,
        "questions": questions_clean
    }

@router.post("/assessment/submit")
async def submit_candidate_assessment(
    req: AnswerSubmitRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        app_id = uuid.UUID(payload.get("sub"))
        attempt_id = uuid.UUID(payload.get("attempt_id"))
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized candidate session")

    app_stmt = select(Application).where(Application.id == app_id)
    app_res = await db.execute(app_stmt)
    app = app_res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    attempt_stmt = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id)
    att_res = await db.execute(attempt_stmt)
    attempt = att_res.scalar_one_or_none()

    drive_stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == app.drive_id)
    drive_res = await db.execute(drive_stmt)
    drive = drive_res.scalar_one_or_none()

    assess_stmt = select(Assessment).where(Assessment.drive_id == app.drive_id)
    assess_res = await db.execute(assess_stmt)
    assessment = assess_res.scalar_one_or_none()

    # Grade questions
    total_marks = 0.0
    scored_marks = 0.0
    questions = assessment.paper_versions.get("A", []) if assessment and assessment.paper_versions else []

    for q in questions:
        q_id = str(q.get("id"))
        q_marks = float(q.get("marks", 1.0))
        total_marks += q_marks
        submitted = req.answers.get(q_id) if req.answers.get(q_id) is not None else req.answers.get(q.get("id"))
        correct = q.get("correct_answer")

        is_correct = False
        if submitted is not None and str(submitted).strip().lower() == str(correct).strip().lower():
            is_correct = True
            scored_marks += q_marks

        # Record answer
        ans = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=uuid.UUID(q_id) if len(q_id) == 36 else uuid.uuid4(),
            submitted_answer={"answer": submitted},
            is_correct=is_correct,
            marks_awarded=q_marks if is_correct else 0.0
        )
        db.add(ans)

    percentage = (scored_marks / total_marks * 100.0) if total_marks > 0 else 0.0
    cutoff = drive.eligibility_rules.get("cutoff_percentage", 60.0) if drive else 60.0

    # Auto-Route to L1_ELIGIBLE or TEST_REJECTED
    is_qualified = percentage >= cutoff
    if is_qualified:
        app.status = "l1_eligible"
    else:
        app.status = "test_rejected"

    if attempt:
        attempt.status = "submitted"
        attempt.final_score = scored_marks
        attempt.percentage = percentage
        attempt.is_qualified = is_qualified
        attempt.device_binding_meta = {
            "device_type": req.device_type,
            "proctoring_telemetry": req.proctoring_telemetry,
            "scored_marks": scored_marks,
            "total_marks": total_marks,
            "cutoff_percentage": cutoff
        }

    # Store proctoring summary on Application
    current_meta = dict(app.custom_field_values or {})
    current_meta["test_score"] = scored_marks
    current_meta["test_total"] = total_marks
    current_meta["test_percentage"] = percentage
    current_meta["device_type"] = req.device_type
    current_meta["proctoring_flags"] = req.proctoring_telemetry
    if not is_qualified:
        current_meta["rejection_stage"] = "Online Test"
        current_meta["rejection_reason"] = f"Scored {percentage:.1f}% (Required cutoff: {cutoff:.1f}%)"

    app.custom_field_values = current_meta
    await db.commit()

    return {
        "status": app.status,
        "is_qualified": is_qualified,
        "score": scored_marks,
        "total": total_marks,
        "percentage": percentage
    }

@router.post("/proctoring/events")
async def log_proctor_telemetry(
    req: Dict[str, Any],
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        attempt_id = uuid.UUID(payload.get("attempt_id"))
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

    proc_stmt = select(ProctorSession).where(ProctorSession.attempt_id == attempt_id)
    proc_res = await db.execute(proc_stmt)
    session = proc_res.scalar_one_or_none()
    if session:
        event = ProctorEvent(
            session_id=session.id,
            event_type=req.get("event_type", "TAB_SWITCH"),
            severity="medium",
            confidence=1.0,
            event_metadata=req
        )
        db.add(event)
        await db.commit()

    return {"status": "recorded"}
