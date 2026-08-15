import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User
from app.models.audit import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    actor_id: Optional[uuid.UUID]
    actor_type: str
    action: str
    resource_type: str
    resource_id: uuid.UUID
    old_value: Optional[dict]
    new_value: Optional[dict]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[AuditLogResponse])
async def query_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "reviewer"]))
):
    stmt = (
        select(AuditLog)
        .where(AuditLog.tenant_id == current_user.tenant_id)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()
