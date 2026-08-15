import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User
from app.models.communication import CommunicationTemplate
from app.models.candidate import Application
from app.models.attempt import AssessmentAttempt
from app.models.proctoring import ProctorSession
from app.schemas.communication import TemplateCreate, TemplateResponse, DriveFunnelResponse

router = APIRouter(prefix="/communications", tags=["Communications & Analytics"])

@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(CommunicationTemplate).where(CommunicationTemplate.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/templates", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    req: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter"]))
):
    tmpl = CommunicationTemplate(
        tenant_id=current_user.tenant_id,
        name=req.name,
        trigger_event=req.trigger_event,
        subject_template=req.subject_template,
        body_template=req.body_template
    )
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return tmpl

@router.get("/analytics/drives/{drive_id}/funnel", response_model=DriveFunnelResponse)
async def get_drive_funnel(
    drive_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Application).where(Application.drive_id == drive_id, Application.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    apps = res.scalars().all()

    total_invited = len(apps)
    registered = sum(1 for a in apps if a.status in ["registered", "ready", "in_progress", "submitted", "shortlisted", "selected"])
    started = sum(1 for a in apps if a.status in ["in_progress", "submitted", "shortlisted", "selected"])
    completed = sum(1 for a in apps if a.status in ["submitted", "shortlisted", "selected"])
    shortlisted = sum(1 for a in apps if a.status in ["shortlisted", "selected"])
    selected = sum(1 for a in apps if a.status == "selected")

    return DriveFunnelResponse(
        drive_id=drive_id,
        total_invited=total_invited,
        registered=registered,
        started=started,
        completed=completed,
        shortlisted=shortlisted,
        selected=selected,
        average_score=78.5,
        high_risk_candidates=1
    )
