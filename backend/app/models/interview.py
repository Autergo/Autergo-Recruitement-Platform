import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("drive_stages.id", ondelete="CASCADE"), nullable=False)
    interview_mode = Column(String(50), nullable=False, default="technical") # human, technical, coding, panel, ai_assisted, hr
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    meeting_link = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="scheduled") # scheduled, in_progress, completed, cancelled, no_show
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    evaluations = relationship("InterviewEvaluation", back_populates="interview", cascade="all, delete-orphan")

class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rubric_ratings = Column(JSONB, nullable=False, default={}) # 1-5 scores
    comments = Column(Text, nullable=False)
    ai_suggested_questions = Column(JSONB, nullable=True)
    ai_summary = Column(Text, nullable=True)
    recommendation = Column(String(50), nullable=False, default="hold") # strong_hire, hire, hold, reject
    submitted_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    interview = relationship("Interview", back_populates="evaluations")

class CandidateScorecard(Base):
    __tablename__ = "candidate_scorecards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    skill_matrix = Column(JSONB, nullable=False, default={})
    role_match_percentage = Column(Numeric(5,2), nullable=False, default=0.0)
    final_decision = Column(String(50), nullable=False, default="pending") # pending, strong_hire, hire, hold, reject
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    decision_notes = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
