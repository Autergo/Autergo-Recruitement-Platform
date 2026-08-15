import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User
from app.models.drive import RecruitmentDrive, DriveStage
from app.models.candidate import Candidate, Application
from app.services.audit_service import AuditService

router = APIRouter(prefix="/drives", tags=["Recruitment Drives"])

class DriveCreate(BaseModel):
    title: str
    job_title: str
    job_description: str
    eligibility_rules: Optional[dict] = {}
    proctoring_config: Optional[dict] = {}

class DriveResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    job_title: str
    status: str
    eligibility_rules: dict
    proctoring_config: dict

    class Config:
        from_attributes = True

@router.get("", response_model=List[DriveResponse])
async def list_drives(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.tenant_id == current_user.tenant_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=DriveResponse, status_code=status.HTTP_201_CREATED)
async def create_drive(
    req: DriveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter"]))
):
    drive = RecruitmentDrive(
        tenant_id=current_user.tenant_id,
        title=req.title,
        job_title=req.job_title,
        job_description=req.job_description,
        eligibility_rules=req.eligibility_rules,
        proctoring_config=req.proctoring_config,
        created_by=current_user.id,
        status="draft"
    )
    db.add(drive)
    await db.flush()

    # Add default stages
    stages = [
        DriveStage(drive_id=drive.id, stage_type="registration", sequence_order=1),
        DriveStage(drive_id=drive.id, stage_type="assessment", sequence_order=2),
        DriveStage(drive_id=drive.id, stage_type="technical_interview", sequence_order=3),
        DriveStage(drive_id=drive.id, stage_type="final_decision", sequence_order=4),
    ]
    db.add_all(stages)
    await db.commit()
    await db.refresh(drive)

    await AuditService.log_action(
        db=db,
        tenant_id=current_user.tenant_id,
        action="DRIVE_CREATED",
        resource_type="recruitment_drives",
        resource_id=drive.id,
        actor_type="user",
        actor_id=current_user.id,
        new_value={"title": drive.title, "job_title": drive.job_title}
    )

    return drive

@router.post("/{drive_id}/publish", response_model=DriveResponse)
async def publish_drive(
    drive_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter"]))
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id, RecruitmentDrive.tenant_id == current_user.tenant_id)
    result = await db.execute(stmt)
    drive = result.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")
        
    drive.status = "published"
    await db.commit()
    await db.refresh(drive)

    await AuditService.log_action(
        db=db,
        tenant_id=current_user.tenant_id,
        action="DRIVE_PUBLISHED",
        resource_type="recruitment_drives",
        resource_id=drive.id,
        actor_type="user",
        actor_id=current_user.id
    )

    return drive
