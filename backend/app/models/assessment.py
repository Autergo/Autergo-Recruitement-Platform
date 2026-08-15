import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drive_id = Column(UUID(as_uuid=True), ForeignKey("recruitment_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    pass_percentage = Column(Numeric(5,2), nullable=False, default=60.0)
    sections = Column(JSONB, nullable=False, default=[])
    paper_versions = Column(JSONB, nullable=False, default={"A": []})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    skill = Column(String(100), nullable=False, index=True)
    topic = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False) # easy, medium, hard
    question_type = Column(String(50), nullable=False) # single_mcq, multiple_mcq, true_false, coding, sql, short_answer
    title = Column(Text, nullable=False)
    content = Column(JSONB, nullable=False, default={})
    correct_answer = Column(JSONB, nullable=False, default={})
    marks = Column(Numeric(5,2), nullable=False, default=1.0)
    negative_marks = Column(Numeric(5,2), nullable=False, default=0.0)
    expected_time_sec = Column(Integer, nullable=False, default=60)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    is_human_verified = Column(Boolean, default=False, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
