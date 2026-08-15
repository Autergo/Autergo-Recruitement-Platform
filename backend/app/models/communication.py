import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class CommunicationTemplate(Base):
    __tablename__ = "communication_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    trigger_event = Column(String(50), nullable=False, index=True) # CANDIDATE_REGISTERED, ASSESSMENT_INVITED, SHORTLISTED, REJECTED, OFFER
    subject_template = Text()
    body_template = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
