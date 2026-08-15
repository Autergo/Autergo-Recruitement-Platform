import uuid
from datetime import datetime
from typing import Optional, Any, Dict
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), nullable=True)
    actor_type = Column(String(50), nullable=False) # 'user', 'candidate', 'system'
    action = Column(String(100), nullable=False, index=True) # e.g. 'DRIVE_PUBLISHED', 'SCORE_OVERRIDDEN'
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        action: str,
        resource_type: str,
        resource_id: uuid.UUID,
        actor_type: str = "system",
        actor_id: Optional[uuid.UUID] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        log_entry = AuditLog(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_type=actor_type,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log_entry)
        await db.flush()
        return log_entry
