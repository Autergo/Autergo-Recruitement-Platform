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
    current_user: User = Depends(require_roles(["org_admin", "admin", "recruitment_manager"]))
):
    stmt = select(User).where(User.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    return res.scalars().all()

from app.core.security import get_password_hash

@router.post("/users", response_model=UserResponse)
async def create_organization_user(
    req: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "admin"]))
):
    stmt = select(User).where(User.email == req.email, User.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        tenant_id=current_user.tenant_id,
        email=req.email.strip().lower(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        role=req.role,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
from pydantic import BaseModel

class RoleCreate(BaseModel):
    role_key: str
    role_name: str
    description: str

@router.get("/roles")
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "admin"]))
):
    stmt = select(Organization).where(Organization.id == current_user.tenant_id)
    res = await db.execute(stmt)
    org = res.scalar_one_or_none()
    
    settings = dict(org.settings or {}) if org else {}
    custom_roles = settings.get("custom_roles", [
        {"role_key": "admin", "role_name": "System Administrator", "description": "Full platform administration, security, and role allocation."},
        {"role_key": "recruiter", "role_name": "Recruiter / Talent Lead", "description": "Drive lifecycle, candidate whitelist import, single/bulk scheduling, attempt unlocking."},
        {"role_key": "l1_interviewer", "role_name": "L1 Technical Evaluator", "description": "L1 pool claim, test paper answers, live GPS coordinates, pass to L2."},
        {"role_key": "l2_interviewer", "role_name": "L2 Panel Reviewer", "description": "L2 pool claim, L1 evaluator notes & ratings, final hiring decision."}
    ])
    return custom_roles

@router.post("/roles")
async def create_custom_role(
    req: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "admin"]))
):
    stmt = select(Organization).where(Organization.id == current_user.tenant_id)
    res = await db.execute(stmt)
    org = res.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    settings = dict(org.settings or {})
    custom_roles = list(settings.get("custom_roles", [
        {"role_key": "admin", "role_name": "System Administrator", "description": "Full platform administration, security, and role allocation."},
        {"role_key": "recruiter", "role_name": "Recruiter / Talent Lead", "description": "Drive lifecycle, candidate whitelist import, single/bulk scheduling, attempt unlocking."},
        {"role_key": "l1_interviewer", "role_name": "L1 Technical Evaluator", "description": "L1 pool claim, test paper answers, live GPS coordinates, pass to L2."},
        {"role_key": "l2_interviewer", "role_name": "L2 Panel Reviewer", "description": "L2 pool claim, L1 evaluator notes & ratings, final hiring decision."}
    ]))

    clean_key = req.role_key.strip().lower().replace(" ", "_")
    for r in custom_roles:
        if r["role_key"] == clean_key:
            raise HTTPException(status_code=400, detail="Role key already exists")

    custom_roles.append({
        "role_key": clean_key,
        "role_name": req.role_name.strip(),
        "description": req.description.strip()
    })

    settings["custom_roles"] = custom_roles
    org.settings = settings
    await db.commit()

    return {"status": "created", "role": custom_roles[-1]}

@router.delete("/users/{user_id}")
async def delete_organization_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    stmt = select(User).where(User.id == user_id, User.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(u)
    await db.commit()
    return {"status": "deleted", "user_id": str(user_id)}
