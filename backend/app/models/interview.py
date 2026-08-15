import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("drive_stages.id", ondelete="CASCADE"), nullable=False, index=True)
    interview_mode = Column(String(50), nullable=False, default="technical") # human, technical, coding, panel, ai_assisted, hr
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    meeting_link = Column(String(500), nullable=True)
    status = Column(String(50), default="scheduled", nullable=False) # scheduled, in_progress, completed, cancelled, no_show

    evaluations = relationship("InterviewEvaluation", back_populates="interview")

class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rubric_ratings = Column(JSON, nullable=False, default={}) # 1-5 scores
    comments = Column(Text, nullable=True)
    ai_suggested_questions = Column(JSON, nullable=True)
    ai_interview_summary = Column(Text, nullable=True)
    recommendation = Column(String(50), nullable=False, default="hire") # strong_hire, hire, hold, reject
    submitted_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    interview = relationship("Interview", back_populates="evaluations")

class CandidateScorecard(Base):
    __tablename__ = "candidate_scorecards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    skill_matrix = Column(JSON, nullable=False, default={})
    role_match_percentage = Column(Float, nullable=False, default=0.0)
    final_decision = Column(String(50), default="under_review", nullable=False)
    decision_notes = Column(Text, nullable=True)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
