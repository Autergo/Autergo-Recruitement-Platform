from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class TemplateCreate(BaseModel):
    name: str
    trigger_event: str # CANDIDATE_REGISTERED, ASSESSMENT_INVITED, SHORTLISTED, REJECTED, OFFER
    subject_template: str
    body_template: str

class TemplateResponse(TemplateCreate):
    id: UUID
    tenant_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class DriveFunnelResponse(BaseModel):
    drive_id: UUID
    total_invited: int
    registered: int
    started: int
    completed: int
    shortlisted: int
    selected: int
    average_score: float
    high_risk_candidates: int
