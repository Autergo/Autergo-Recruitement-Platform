import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User
from app.models.candidate import Candidate, Application
from app.models.drive import RecruitmentDrive
from app.models.assessment import Assessment
from app.models.attempt import AssessmentAttempt, AttemptAnswer
from app.models.interview import Interview, InterviewEvaluation

router = APIRouter(prefix="/interviews", tags=["Interview Pools & Evaluations"])

class EvaluationRequest(BaseModel):
    decision: str # PASS or REJECT
    rating: float # 1.0 to 5.0
    feedback: str # Detailed notes

# ----------------------------------------------------
# L1 INTERVIEWER ENDPOINTS
# ----------------------------------------------------

@router.get("/l1/pool")
async def list_l1_candidate_pool(
    drive_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l1_interviewer", "recruiter", "org_admin", "admin"]))
):
    query = select(Application).where(
        Application.tenant_id == current_user.tenant_id,
        Application.status.in_(["l1_eligible", "l1_in_progress"])
    )
    if drive_id:
        query = query.where(Application.drive_id == drive_id)

    stmt = query.order_by(desc(Application.applied_at))
    res = await db.execute(stmt)
    apps = res.scalars().all()

    output = []
    for a in apps:
        cand_stmt = select(Candidate).where(Candidate.id == a.candidate_id)
        cand_res = await db.execute(cand_stmt)
        cand = cand_res.scalar_one_or_none()

        drive_stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == a.drive_id)
        drive_res = await db.execute(drive_stmt)
        drive = drive_res.scalar_one_or_none()

        meta = dict(a.custom_field_values or {})
        claimed_by_id = meta.get("l1_interviewer_id")

        output.append({
            "application_id": str(a.id),
            "candidate_name": cand.full_name if cand else "Candidate",
            "email": cand.email if cand else "",
            "phone": cand.phone if cand else "",
            "drive_title": drive.title if drive else "Recruitment Drive",
            "experience_years": meta.get("experience_years", 0),
            "referral_source": meta.get("referral_source", "Direct"),
            "test_score": meta.get("test_score", 0),
            "test_percentage": meta.get("test_percentage", 0),
            "device_type": meta.get("device_type", "laptop"),
            "status": a.status,
            "is_claimed": a.status == "l1_in_progress",
            "is_claimed_by_me": claimed_by_id == str(current_user.id),
            "claimed_by_name": meta.get("l1_interviewer_name"),
        })
    return output

@router.post("/l1/{application_id}/claim")
async def claim_l1_candidate(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l1_interviewer", "recruiter", "org_admin", "admin"]))
):
    stmt = select(Application).where(Application.id == application_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate application not found")

    if app.status != "l1_eligible":
        raise HTTPException(status_code=400, detail="Candidate is not eligible or already claimed")

    app.status = "l1_in_progress"
    meta = dict(app.custom_field_values or {})
    meta["l1_interviewer_id"] = str(current_user.id)
    meta["l1_interviewer_name"] = current_user.full_name
    meta["l1_claimed_at"] = datetime.utcnow().isoformat()
    app.custom_field_values = meta
    await db.commit()

    return {"status": "claimed", "candidate_id": str(app.id)}

@router.post("/l1/{application_id}/release")
async def release_l1_candidate(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l1_interviewer", "recruiter", "org_admin", "admin"]))
):
    stmt = select(Application).where(Application.id == application_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate application not found")

    app.status = "l1_eligible"
    meta = dict(app.custom_field_values or {})
    meta.pop("l1_interviewer_id", None)
    meta.pop("l1_interviewer_name", None)
    meta.pop("l1_claimed_at", None)
    app.custom_field_values = meta
    await db.commit()

    return {"status": "released"}

@router.get("/l1/{application_id}/dossier")
async def get_l1_candidate_dossier(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l1_interviewer", "recruiter", "org_admin", "admin"]))
):
    app_stmt = select(Application).where(Application.id == application_id)
    app_res = await db.execute(app_stmt)
    app = app_res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cand_stmt = select(Candidate).where(Candidate.id == app.candidate_id)
    cand_res = await db.execute(cand_stmt)
    cand = cand_res.scalar_one_or_none()

    drive_stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == app.drive_id)
    drive_res = await db.execute(drive_stmt)
    drive = drive_res.scalar_one_or_none()

    assess_stmt = select(Assessment).where(Assessment.drive_id == app.drive_id)
    assess_res = await db.execute(assess_stmt)
    assessment = assess_res.scalar_one_or_none()

    # Fetch attempt answers
    att_stmt = select(AssessmentAttempt).where(AssessmentAttempt.application_id == app.id)
    att_res = await db.execute(att_stmt)
    attempt = att_res.scalar_one_or_none()

    answers_map = {}
    if attempt:
        ans_stmt = select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt.id)
        ans_res = await db.execute(ans_stmt)
        for ans in ans_res.scalars().all():
            answers_map[str(ans.question_id)] = {
                "submitted": ans.submitted_answer.get("answer"),
                "is_correct": ans.is_correct,
                "marks_awarded": ans.marks_awarded
            }

    # Assemble paper breakdown
    questions_graded = []
    if assessment and assessment.paper_versions:
        for q in assessment.paper_versions.get("A", []):
            qid = str(q.get("id"))
            ans_info = answers_map.get(qid, {})
            questions_graded.append({
                "id": qid,
                "title": q.get("title"),
                "question_type": q.get("question_type"),
                "options": q.get("options", []),
                "correct_answer": q.get("correct_answer"),
                "submitted_answer": ans_info.get("submitted"),
                "is_correct": ans_info.get("is_correct", False),
                "marks": q.get("marks", 1.0),
                "marks_awarded": ans_info.get("marks_awarded", 0.0)
            })

    meta = dict(app.custom_field_values or {})
    return {
        "application_id": str(app.id),
        "status": app.status,
        "candidate": {
            "name": cand.full_name if cand else "Candidate",
            "email": cand.email if cand else "",
            "phone": cand.phone if cand else "",
            "experience_years": meta.get("experience_years", 0),
            "referral_source": meta.get("referral_source", "Direct"),
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
        },
        "drive": {
            "title": drive.title if drive else "",
            "job_title": drive.job_title if drive else "",
            "cutoff_percentage": drive.eligibility_rules.get("cutoff_percentage", 60.0) if drive else 60.0
        },
        "test_results": {
            "score": meta.get("test_score", 0),
            "total": meta.get("test_total", 0),
            "percentage": meta.get("test_percentage", 0),
            "device_type": meta.get("device_type", "laptop"),
            "proctoring_flags": meta.get("proctoring_flags", {}),
            "questions_graded": questions_graded
        }
    }

@router.post("/l1/{application_id}/evaluate")
async def submit_l1_evaluation(
    application_id: uuid.UUID,
    req: EvaluationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l1_interviewer", "recruiter", "org_admin", "admin"]))
):
    stmt = select(Application).where(Application.id == application_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate application not found")

    is_pass = req.decision.upper() == "PASS"
    app.status = "l2_eligible" if is_pass else "l1_rejected"

    meta = dict(app.custom_field_values or {})
    meta["l1_rating"] = req.rating
    meta["l1_feedback"] = req.feedback
    meta["l1_decision"] = "PASS" if is_pass else "REJECT"
    meta["l1_evaluated_at"] = datetime.utcnow().isoformat()
    meta["l1_interviewer_name"] = current_user.full_name

    if not is_pass:
        meta["rejection_stage"] = "L1 Technical Round"
        meta["rejection_reason"] = req.feedback

    app.custom_field_values = meta
    await db.commit()

    return {"status": app.status, "decision": meta["l1_decision"]}

# ----------------------------------------------------
# L2 INTERVIEWER ENDPOINTS
# ----------------------------------------------------

@router.get("/l2/pool")
async def list_l2_candidate_pool(
    drive_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l2_interviewer", "recruiter", "org_admin", "admin"]))
):
    query = select(Application).where(
        Application.tenant_id == current_user.tenant_id,
        Application.status.in_(["l2_eligible", "l2_in_progress"])
    )
    if drive_id:
        query = query.where(Application.drive_id == drive_id)

    stmt = query.order_by(desc(Application.applied_at))
    res = await db.execute(stmt)
    apps = res.scalars().all()

    output = []
    for a in apps:
        cand_stmt = select(Candidate).where(Candidate.id == a.candidate_id)
        cand_res = await db.execute(cand_stmt)
        cand = cand_res.scalar_one_or_none()

        drive_stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == a.drive_id)
        drive_res = await db.execute(drive_stmt)
        drive = drive_res.scalar_one_or_none()

        meta = dict(a.custom_field_values or {})
        claimed_by_id = meta.get("l2_interviewer_id")

        output.append({
            "application_id": str(a.id),
            "candidate_name": cand.full_name if cand else "Candidate",
            "email": cand.email if cand else "",
            "phone": cand.phone if cand else "",
            "drive_title": drive.title if drive else "Recruitment Drive",
            "experience_years": meta.get("experience_years", 0),
            "referral_source": meta.get("referral_source", "Direct"),
            "test_score": meta.get("test_score", 0),
            "test_percentage": meta.get("test_percentage", 0),
            "l1_rating": meta.get("l1_rating"),
            "l1_interviewer_name": meta.get("l1_interviewer_name"),
            "l1_feedback": meta.get("l1_feedback"),
            "status": a.status,
            "is_claimed": a.status == "l2_in_progress",
            "is_claimed_by_me": claimed_by_id == str(current_user.id),
            "claimed_by_name": meta.get("l2_interviewer_name"),
        })
    return output

@router.post("/l2/{application_id}/claim")
async def claim_l2_candidate(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l2_interviewer", "recruiter", "org_admin", "admin"]))
):
    stmt = select(Application).where(Application.id == application_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if app.status != "l2_eligible":
        raise HTTPException(status_code=400, detail="Candidate is not eligible for L2 or already claimed")

    app.status = "l2_in_progress"
    meta = dict(app.custom_field_values or {})
    meta["l2_interviewer_id"] = str(current_user.id)
    meta["l2_interviewer_name"] = current_user.full_name
    meta["l2_claimed_at"] = datetime.utcnow().isoformat()
    app.custom_field_values = meta
    await db.commit()

    return {"status": "claimed", "candidate_id": str(app.id)}

@router.post("/l2/{application_id}/release")
async def release_l2_candidate(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l2_interviewer", "recruiter", "org_admin", "admin"]))
):
    stmt = select(Application).where(Application.id == application_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate not found")

    app.status = "l2_eligible"
    meta = dict(app.custom_field_values or {})
    meta.pop("l2_interviewer_id", None)
    meta.pop("l2_interviewer_name", None)
    meta.pop("l2_claimed_at", None)
    app.custom_field_values = meta
    await db.commit()

    return {"status": "released"}

@router.get("/l2/{application_id}/dossier")
async def get_l2_candidate_dossier(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l2_interviewer", "recruiter", "org_admin", "admin"]))
):
    # Same as L1 dossier + L1 notes and rating
    l1_dossier = await get_l1_candidate_dossier(application_id, db, current_user)
    
    app_stmt = select(Application).where(Application.id == application_id)
    app_res = await db.execute(app_stmt)
    app = app_res.scalar_one_or_none()
    meta = dict(app.custom_field_values or {}) if app else {}

    l1_dossier["l1_evaluation"] = {
        "interviewer_name": meta.get("l1_interviewer_name"),
        "rating": meta.get("l1_rating"),
        "feedback": meta.get("l1_feedback"),
        "decision": meta.get("l1_decision"),
        "evaluated_at": meta.get("l1_evaluated_at")
    }
    return l1_dossier

@router.post("/l2/{application_id}/evaluate")
async def submit_l2_evaluation(
    application_id: uuid.UUID,
    req: EvaluationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["l2_interviewer", "recruiter", "org_admin", "admin"]))
):
    stmt = select(Application).where(Application.id == application_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate not found")

    is_pass = req.decision.upper() == "PASS"
    app.status = "selected" if is_pass else "l2_rejected"

    meta = dict(app.custom_field_values or {})
    meta["l2_rating"] = req.rating
    meta["l2_feedback"] = req.feedback
    meta["l2_decision"] = "PASS" if is_pass else "REJECT"
    meta["l2_evaluated_at"] = datetime.utcnow().isoformat()
    meta["l2_interviewer_name"] = current_user.full_name

    if not is_pass:
        meta["rejection_stage"] = "L2 Technical Round"
        meta["rejection_reason"] = req.feedback

    app.custom_field_values = meta
    await db.commit()

    return {"status": app.status, "decision": meta["l2_decision"]}

# ----------------------------------------------------
# SCHEDULING ENDPOINTS (MANUAL & BULK)
# ----------------------------------------------------

class SingleScheduleRequest(BaseModel):
    application_id: uuid.UUID
    stage: str = "L1" # L1 or L2
    interviewer_id: Optional[uuid.UUID] = None
    slot_datetime: str
    meeting_link: Optional[str] = "https://meet.autergo.internal"

class BulkScheduleRequest(BaseModel):
    application_ids: List[uuid.UUID]
    stage: str = "L1" # L1 or L2
    start_datetime: str
    slot_duration_minutes: int = 45
    meeting_link: Optional[str] = "https://meet.autergo.internal"

@router.post("/schedule/single")
async def schedule_single_interview(
    req: SingleScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    stmt = select(Application).where(Application.id == req.application_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate application not found")

    meta = dict(app.custom_field_values or {})
    sched_key = f"{req.stage.lower()}_schedule"
    meta[sched_key] = {
        "slot_datetime": req.slot_datetime,
        "interviewer_id": str(req.interviewer_id) if req.interviewer_id else None,
        "meeting_link": req.meeting_link,
        "scheduled_by": current_user.full_name,
        "scheduled_at": datetime.utcnow().isoformat()
    }
    app.custom_field_values = meta
    await db.commit()

    return {"status": "scheduled", "application_id": str(app.id), "schedule": meta[sched_key]}

@router.post("/schedule/bulk")
async def schedule_bulk_interviews(
    req: BulkScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    scheduled_count = 0
    for app_id in req.application_ids:
        stmt = select(Application).where(Application.id == app_id)
        res = await db.execute(stmt)
        app = res.scalar_one_or_none()
        if app:
            meta = dict(app.custom_field_values or {})
            sched_key = f"{req.stage.lower()}_schedule"
            meta[sched_key] = {
                "start_datetime": req.start_datetime,
                "meeting_link": req.meeting_link,
                "scheduled_by": current_user.full_name,
                "scheduled_at": datetime.utcnow().isoformat(),
                "slot_duration_minutes": req.slot_duration_minutes
            }
            app.custom_field_values = meta
            scheduled_count += 1

    await db.commit()
    return {"status": "bulk_scheduled", "total_scheduled": scheduled_count}
