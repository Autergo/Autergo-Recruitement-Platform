import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_candidate_session_token
from app.models.candidate import Candidate, Application
from app.models.drive import RecruitmentDrive
from app.models.assessment import Assessment, Question
from app.models.attempt import AssessmentAttempt, AttemptAnswer
from app.models.proctoring import ProctorSession, ProctorEvent
from app.services.sandbox_service import SandboxService
from app.services.risk_engine import RiskEngine
from app.core.ws_manager import ws_manager

router = APIRouter(prefix="/public", tags=["Candidate Public Interface"])

class VerifyRequest(BaseModel):
    invitation_token: str
    email: EmailStr
    otp: str

class AutoSaveRequest(BaseModel):
    question_id: uuid.UUID
    submitted_answer: Dict[str, Any]

class CodeRunRequest(BaseModel):
    question_id: uuid.UUID
    language: str
    source_code: str

class ProctorEventRequest(BaseModel):
    event_type: str
    confidence: float
    evidence_media_url: Optional[str] = None

@router.get("/invitations/{token}")
async def check_invitation(token: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Application).where(Application.invitation_token == token)
    result = await db.execute(stmt)
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation token")
    
    drive_stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == app.drive_id)
    drive_res = await db.execute(drive_stmt)
    drive = drive_res.scalar_one_or_none()
    
    return {
        "valid": True,
        "drive_title": drive.title if drive else "Assessment Drive",
        "job_title": drive.job_title if drive else "Candidate Assessment",
        "status": app.status
    }

@router.post("/verify")
async def verify_candidate(req: VerifyRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Application).where(Application.invitation_token == req.invitation_token)
    result = await db.execute(stmt)
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Invalid invitation token")

    # In dev mode, accept OTP '123456'
    if req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # Check if attempt already exists, else create one
    attempt_stmt = select(AssessmentAttempt).where(AssessmentAttempt.application_id == app.id)
    attempt_res = await db.execute(attempt_stmt)
    attempt = attempt_res.scalar_one_or_none()

    if not attempt:
        attempt = AssessmentAttempt(
            application_id=app.id,
            paper_version="A",
            status="started",
            session_token_hash="hash",
            remaining_seconds=3600
        )
        db.add(attempt)
        await db.flush()

        proctor = ProctorSession(attempt_id=attempt.id, risk_score=0.0)
        db.add(proctor)
        
        app.status = "in_progress"
        await db.commit()

    token = create_candidate_session_token(
        application_id=str(app.id),
        tenant_id=str(app.tenant_id),
        attempt_id=str(attempt.id),
        duration_minutes=60
    )

    return {
        "session_token": token,
        "attempt_id": str(attempt.id),
        "status": attempt.status,
        "remaining_seconds": attempt.remaining_seconds
    }

@router.post("/assessment/answers/autosave")
async def autosave_answer(
    req: AutoSaveRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        attempt_id = uuid.UUID(payload.get("attempt_id"))
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized candidate session")

    stmt = select(AttemptAnswer).where(
        AttemptAnswer.attempt_id == attempt_id,
        AttemptAnswer.question_id == req.question_id
    )
    res = await db.execute(stmt)
    answer = res.scalar_one_or_none()

    if not answer:
        answer = AttemptAnswer(
            attempt_id=attempt_id,
            question_id=req.question_id,
            submitted_answer=req.submitted_answer
        )
        db.add(answer)
    else:
        answer.submitted_answer = req.submitted_answer

    await db.commit()
    return {"saved": True}

@router.post("/assessment/code/execute")
async def execute_candidate_code(
    req: CodeRunRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    # Fetch test cases from question
    q_stmt = select(Question).where(Question.id == req.question_id)
    q_res = await db.execute(q_stmt)
    question = q_res.scalar_one_or_none()
    
    test_cases = question.content.get("test_cases", []) if question and question.content else [
        {"input": "test", "expected_output": "test"}
    ]
    
    result = await SandboxService.execute_code(
        language=req.language,
        source_code=req.source_code,
        test_cases=test_cases
    )
    return result

@router.post("/assessment/submit")
async def submit_assessment(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        attempt_id = uuid.UUID(payload.get("attempt_id"))
        app_id = uuid.UUID(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized candidate session")

    stmt = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id)
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    attempt.status = "submitted"
    
    app_stmt = select(Application).where(Application.id == app_id)
    app_res = await db.execute(app_stmt)
    app = app_res.scalar_one_or_none()
    if app:
        app.status = "submitted"
        # Broadcast to recruiter command center
        await ws_manager.broadcast_to_drive(
            drive_id=str(app.drive_id),
            event_type="CANDIDATE_STATUS_UPDATE",
            data={
                "candidate_id": str(app.candidate_id),
                "status": "submitted"
            }
        )

    await db.commit()
    return {"submitted": True, "status": "submitted"}

@router.post("/proctoring/events")
async def ingest_proctor_event(
    req: ProctorEventRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        attempt_id = uuid.UUID(payload.get("attempt_id"))
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized session")

    stmt = select(ProctorSession).where(ProctorSession.attempt_id == attempt_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Proctor session not found")

    event = ProctorEvent(
        session_id=session.id,
        event_type=req.event_type,
        confidence=req.confidence,
        severity="critical" if req.event_type in ["MULTIPLE_FACES", "PHONE_DETECTED"] else "low",
        evidence_media_url=req.evidence_media_url
    )
    db.add(event)
    await db.flush()

    # Recalculate risk score
    all_events_stmt = select(ProctorEvent).where(ProctorEvent.session_id == session.id)
    all_events_res = await db.execute(all_events_stmt)
    all_events = all_events_res.scalars().all()
    
    event_dicts = [{"event_type": e.event_type, "confidence": float(e.confidence)} for e in all_events]
    risk_data = RiskEngine.calculate_risk_score(event_dicts)
    
    session.risk_score = risk_data["risk_score"]
    session.risk_level = risk_data["risk_level"]
    await db.commit()

    return {"status": "recorded", "risk_score": session.risk_score, "risk_level": session.risk_level}
