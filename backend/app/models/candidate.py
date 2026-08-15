import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    resume_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="invited") 
    # invited -> registered -> verified -> ready -> in_progress -> submitted -> under_review -> shortlisted -> interview_scheduled -> interview_completed -> final_review -> selected/rejected/hold
    invitation_token = Column(String(255), unique=True, nullable=False, index=True)
    custom_field_values = Column(JSONB, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    candidate = relationship("Candidate", back_populates="applications")
    drive = relationship("RecruitmentDrive", back_populates="applications")
    attempts = relationship("AssessmentAttempt", back_populates="application", cascade="all, delete-orphan")
