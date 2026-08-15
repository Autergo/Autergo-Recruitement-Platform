import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    actor_type = Column(String(50), nullable=False, default="user") # user, system, candidate, candidate_token
    action = Column(String(100), nullable=False, index=True) # DRIVE_PUBLISHED, CANDIDATE_SHORTLISTED, PROCTORING_VIOLATION_CONFIRMED
    resource_type = Column(String(100), nullable=False) # drives, candidates, evaluations
    resource_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
