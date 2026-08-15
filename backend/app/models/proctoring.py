import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProctorSession(Base):
    __tablename__ = "proctor_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    risk_score = Column(Numeric(5,2), nullable=False, default=0.0)
    risk_level = Column(String(20), nullable=False, default="NORMAL") # NORMAL, WATCH, SUSPICIOUS, CRITICAL
    adjudication_status = Column(String(50), nullable=False, default="pending") # pending, confirmed_violation, ignored, flagged_for_review
    adjudicated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    adjudication_notes = Column(Text, nullable=True)

    attempt = relationship("AssessmentAttempt", back_populates="proctor_session")
    events = relationship("ProctorEvent", back_populates="session", cascade="all, delete-orphan", order_by="ProctorEvent.timestamp")

class ProctorEvent(Base):
    __tablename__ = "proctor_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("proctor_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True) # FACE_ABSENT, MULTIPLE_FACES, PHONE_DETECTED, TAB_SWITCHED, FULLSCREEN_EXIT, AUDIO_VOICE_DETECTED, CAMERA_DISCONNECTED
    confidence = Column(Numeric(4,2), nullable=False, default=1.0)
    severity = Column(String(20), nullable=False, default="low") # low, medium, high, critical
    risk_weight = Column(Numeric(5,2), nullable=False, default=0.0)
    evidence_media_url = Column(Text, nullable=True)
    model_version = Column(String(50), nullable=False, default="v1.0")
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    session = relationship("ProctorSession", back_populates="events")
