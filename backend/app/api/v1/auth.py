import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import jwt
from jwt.exceptions import PyJWTError as JWTError
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.organization import User, Organization
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        if user_id is None or tenant_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(User).where(User.id == uuid.UUID(user_id), User.tenant_id == uuid.UUID(tenant_id), User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != "org_admin" and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles}"
            )
        return current_user
    return role_checker

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.strip().lower()
    stmt = select(User).where(User.email.ilike(clean_email), User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    access_token = create_access_token(subject=user.id, tenant_id=user.tenant_id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, tenant_id=user.tenant_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": str(user.tenant_id)
        }
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

class NameLoginRequest(BaseModel):
    name: str
    role: str = "l1_interviewer" # l1_interviewer or l2_interviewer

@router.post("/interviewer-login", response_model=TokenResponse)
async def interviewer_name_login(req: NameLoginRequest, db: AsyncSession = Depends(get_db)):
    # Find or auto-create interviewer user
    stmt = select(User).where(User.full_name.ilike(f"%{req.name.strip()}%"), User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        # Find default organization
        org_stmt = select(Organization).limit(1)
        org_res = await db.execute(org_stmt)
        org = org_res.scalar_one_or_none()
        tenant_id = org.id if org else uuid.uuid4()

        user = User(
            tenant_id=tenant_id,
            email=f"{req.name.lower().replace(' ', '.')}@interviewer.autergo.internal",
            password_hash=get_password_hash("Interviewer@123"),
            full_name=req.name.strip(),
            role=req.role,
            is_active=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(subject=user.id, tenant_id=user.tenant_id, role=req.role)
    refresh_token = create_refresh_token(subject=user.id, tenant_id=user.tenant_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": req.role,
            "tenant_id": str(user.tenant_id)
        }
    )

@router.get("/interviewers")
async def list_available_interviewers(db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.role.in_(["l1_interviewer", "l2_interviewer", "recruiter", "admin"]))
    res = await db.execute(stmt)
    users = res.scalars().all()
    return [{"id": str(u.id), "full_name": u.full_name, "role": u.role} for u in users]
