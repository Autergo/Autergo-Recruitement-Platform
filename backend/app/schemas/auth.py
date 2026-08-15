from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "recruiter"

class UserResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationCreate(BaseModel):
    name: str
    slug: str
    settings: Optional[Dict[str, Any]] = {}

class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    settings: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
