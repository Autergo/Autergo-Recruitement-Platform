import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    applications = relationship("Application", back_populates="candidate")

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    current_stage_id = Column(UUID(as_uuid=True), ForeignKey("drive_stages.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(50), default="invited", nullable=False, index=True)
    invitation_token = Column(String(255), unique=True, nullable=True, index=True)
    otp_hash = Column(String(255), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    custom_field_values = Column(JSON, nullable=False, default={})
    applied_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    candidate = relationship("Candidate", back_populates="applications")
    drive = relationship("RecruitmentDrive", back_populates="applications")
