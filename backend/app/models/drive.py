import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class RecruitmentDrive(Base):
    __tablename__ = "recruitment_drives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="draft") # draft, published, live, paused, completed, archived
    eligibility_rules = Column(JSONB, nullable=False, default={})
    proctoring_config = Column(JSONB, nullable=False, default={})
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stages = relationship("DriveStage", back_populates="drive", cascade="all, delete-orphan", order_by="DriveStage.sequence_order")
    form_fields = relationship("CandidateFormField", back_populates="drive", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="drive", cascade="all, delete-orphan")

class DriveStage(Base):
    __tablename__ = "drive_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_type = Column(String(50), nullable=False) # registration, assessment, technical_interview, manager_interview, hr_interview, final_decision
    sequence_order = Column(Integer, nullable=False)
    configuration = Column(JSONB, nullable=False, default={})

    drive = relationship("RecruitmentDrive", back_populates="stages")

class CandidateFormField(Base):
    __tablename__ = "candidate_form_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    label = Column(String(255), nullable=False)
    field_type = Column(String(50), nullable=False) # text, number, dropdown, multi_select, date, file, resume, checkbox, url
    is_required = Column(Boolean, default=False, nullable=False)
    validation_rules = Column(JSONB, nullable=False, default={})

    drive = relationship("RecruitmentDrive", back_populates="form_fields")
