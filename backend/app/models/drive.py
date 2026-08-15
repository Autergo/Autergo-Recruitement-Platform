import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class RecruitmentDrive(Base):
    __tablename__ = "recruitment_drives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=False)
    status = Column(String(50), default="draft", nullable=False, index=True) # draft, published, live, paused, completed, archived
    eligibility_rules = Column(JSON, nullable=False, default={})
    proctoring_config = Column(JSON, nullable=False, default={})
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stages = relationship("DriveStage", back_populates="drive", cascade="all, delete-orphan", order_by="DriveStage.sequence_order")
    assessments = relationship("Assessment", back_populates="drive", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="drive")

class DriveStage(Base):
    __tablename__ = "drive_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_type = Column(String(50), nullable=False) # registration, assessment, technical_interview, hr_interview, final_decision
    sequence_order = Column(Integer, nullable=False)
    is_mandatory = Column(Boolean, default=True)
    configuration = Column(JSON, nullable=False, default={})

    drive = relationship("RecruitmentDrive", back_populates="stages")

class CandidateFormField(Base):
    __tablename__ = "candidate_form_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    field_label = Column(String(255), nullable=False)
    field_type = Column(String(50), nullable=False) # text, number, dropdown, multi_select, date, file, resume
    is_required = Column(Boolean, default=False)
    validation_rules = Column(JSON, nullable=False, default={})
    sequence_order = Column(Integer, default=0)
