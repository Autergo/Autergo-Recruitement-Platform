import uuid
from typing import Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog

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
