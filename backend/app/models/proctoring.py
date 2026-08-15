import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProctorSession(Base):
    __tablename__ = "proctor_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    status = Column(String(50), default="active", nullable=False) # active, paused, completed, terminated
    suspicion_score = Column(Float, default=0.0, nullable=False)
    risk_level = Column(String(50), default="normal", nullable=False) # normal, suspicious, critical
    total_events_count = Column(Float, default=0.0, nullable=False)
    unresolved_flags_count = Column(Float, default=0.0, nullable=False)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    events = relationship("ProctorEvent", back_populates="session", cascade="all, delete-orphan", order_by="ProctorEvent.timestamp")

class ProctorEvent(Base):
    __tablename__ = "proctor_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("proctor_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True) # face_not_detected, multiple_faces, phone_detected, tab_switch
    severity = Column(String(50), nullable=False, default="medium") # low, medium, high, critical
    confidence = Column(Float, nullable=False, default=1.0)
    evidence_media_url = Column(String(1000), nullable=True)
    event_metadata = Column(JSON, nullable=False, default={})
    adjudication_status = Column(String(50), default="pending", nullable=False) # pending, confirmed_violation, ignored, needs_review
    adjudicated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    adjudicated_at = Column(DateTime(timezone=True), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    session = relationship("ProctorSession", back_populates="events")
