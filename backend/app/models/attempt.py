import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_version = Column(String(10), default="A", nullable=False)
    status = Column(String(50), default="started", nullable=False) # started, in_progress, disconnected, submitted, evaluated
    session_token_hash = Column(String(255), nullable=False)
    device_binding_meta = Column(JSONB, nullable=False, default={})
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    remaining_seconds = Column(Integer, nullable=False, default=3600)
    total_score = Column(Numeric(6,2), nullable=True)
    percentage = Column(Numeric(5,2), nullable=True)
    section_scores = Column(JSONB, nullable=False, default={})

    application = relationship("Application", back_populates="attempts")
    answers = relationship("AttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")
    proctor_session = relationship("ProctorSession", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False, index=True)
    submitted_answer = Column(JSONB, nullable=False, default={})
    is_correct = Column(Boolean, nullable=True)
    score_awarded = Column(Numeric(5,2), nullable=False, default=0.0)
    code_execution_results = Column(JSONB, nullable=True)
    ai_evaluation_meta = Column(JSONB, nullable=True)
    saved_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="answers")
