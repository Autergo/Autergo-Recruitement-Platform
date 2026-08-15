import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_version = Column(String(10), default="A", nullable=False)
    status = Column(String(50), default="in_progress", nullable=False) # ready, in_progress, submitted, time_expired, terminated
    started_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    time_remaining_sec = Column(Float, nullable=False, default=3600.0)
    device_binding_meta = Column(JSON, nullable=False, default={})
    is_session_active = Column(Boolean, default=True)
    last_heartbeat_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    final_score = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    is_qualified = Column(Boolean, nullable=True)
    section_scores = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    answers = relationship("AttemptAnswer", back_populates="attempt")

class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_answer = Column(JSON, nullable=False, default={})
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, nullable=True)
    code_execution_results = Column(JSON, nullable=True)
    ai_evaluation_meta = Column(JSON, nullable=True)
    time_spent_sec = Column(Float, nullable=False, default=0.0)
    saved_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="answers")
