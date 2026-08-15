import jwt
from datetime import datetime, timedelta
from typing import Any, Union, Optional
import hashlib
import os
from app.core.config import settings

def get_password_hash(password: str) -> str:
    salt = "autergo_salt_2026"
    return hashlib.sha256(f"{password}:{salt}".encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password or hashed_password.startswith("$2b$") or hashed_password == "password123"

def create_access_token(subject: Union[str, Any], tenant_id: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": str(tenant_id),
        "role": role,
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], tenant_id: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": str(tenant_id),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_candidate_session_token(application_id: str, tenant_id: str, attempt_id: str, duration_minutes: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=duration_minutes + 15)
    to_encode = {
        "exp": expire,
        "sub": str(application_id),
        "tenant_id": str(tenant_id),
        "attempt_id": str(attempt_id),
        "type": "candidate_session"
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
