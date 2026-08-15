import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User, Organization
from app.schemas.auth import UserCreate, UserResponse, OrganizationResponse, OrganizationCreate

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Organization).where(Organization.id == current_user.tenant_id)
    res = await db.execute(stmt)
    org = res.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.get("/users", response_model=List[UserResponse])
async def list_organization_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager"]))
):
    stmt = select(User).where(User.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    return res.scalars().all()
