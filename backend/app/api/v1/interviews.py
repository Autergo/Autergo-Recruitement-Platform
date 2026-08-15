import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User
from app.models.interview import Interview, InterviewEvaluation, CandidateScorecard
from app.models.candidate import Application
from app.schemas.interview import InterviewCreate, InterviewResponse, EvaluationSubmit, ScorecardResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/interviews", tags=["Interview Engine & Evaluations"])

@router.get("", response_model=List[InterviewResponse])
async def list_interviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Interview)
        .join(Application, Application.id == Interview.application_id)
        .where(Application.tenant_id == current_user.tenant_id)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
async def schedule_interview(
    req: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter"]))
):
    interview = Interview(
        application_id=req.application_id,
        stage_id=req.stage_id,
        interview_mode=req.interview_mode,
        scheduled_start=req.scheduled_start,
        scheduled_end=req.scheduled_end,
        meeting_link=req.meeting_link,
        status="scheduled"
    )
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    return interview

@router.post("/evaluate", status_code=status.HTTP_200_OK)
async def submit_evaluation(
    req: EvaluationSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruiter", "interviewer", "hiring_manager"]))
):
    stmt = select(Interview).where(Interview.id == req.interview_id)
    res = await db.execute(stmt)
    interview = res.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    evaluation = InterviewEvaluation(
        interview_id=interview.id,
        interviewer_id=current_user.id,
        rubric_ratings=req.rubric_ratings,
        comments=req.comments,
        recommendation=req.recommendation
    )
    db.add(evaluation)
    interview.status = "completed"

    # Auto-consolidate Candidate Scorecard
    scorecard_stmt = select(CandidateScorecard).where(CandidateScorecard.application_id == interview.application_id)
    sc_res = await db.execute(scorecard_stmt)
    scorecard = sc_res.scalar_one_or_none()

    if not scorecard:
        scorecard = CandidateScorecard(
            application_id=interview.application_id,
            skill_matrix={"interviews": req.rubric_ratings},
            role_match_percentage=88.0,
            final_decision=req.recommendation
        )
        db.add(scorecard)
    else:
        scorecard.final_decision = req.recommendation

    await db.commit()

    await AuditService.log_action(
        db=db,
        tenant_id=current_user.tenant_id,
        action="INTERVIEW_EVALUATION_SUBMITTED",
        resource_type="interviews",
        resource_id=interview.id,
        actor_type="user",
        actor_id=current_user.id,
        new_value={"recommendation": req.recommendation}
    )

    return {"status": "success", "message": "Evaluation recorded and Candidate 360 updated"}
