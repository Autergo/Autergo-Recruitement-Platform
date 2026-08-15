import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    duration_minutes = Column(Float, nullable=False, default=60.0)
    sections = Column(JSON, nullable=False, default=[])
    paper_versions = Column(JSON, nullable=False, default={"A": []})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    drive = relationship("RecruitmentDrive", back_populates="assessments")

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    skill = Column(String(100), nullable=False, index=True)
    topic = Column(String(100), nullable=False)
    difficulty = Column(String(50), nullable=False, default="medium")
    question_type = Column(String(50), nullable=False, default="single_mcq")
    title = Column(String(500), nullable=False)
    content = Column(JSON, nullable=False, default={})
    correct_answer = Column(JSON, nullable=False, default={})
    marks = Column(Float, nullable=False, default=1.0)
    negative_marks = Column(Float, nullable=False, default=0.0)
    expected_time_sec = Column(Float, nullable=False, default=60.0)
    is_ai_generated = Column(Boolean, default=False)
    is_human_verified = Column(Boolean, default=False)
    version = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
