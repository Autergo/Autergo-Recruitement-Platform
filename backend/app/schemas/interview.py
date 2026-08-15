from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

class InterviewCreate(BaseModel):
    application_id: UUID
    stage_id: UUID
    interview_mode: str = "technical" # human, technical, coding, panel, ai_assisted, hr
    scheduled_start: datetime
    scheduled_end: datetime
    meeting_link: Optional[str] = None

class InterviewResponse(BaseModel):
    id: UUID
    application_id: UUID
    stage_id: UUID
    interview_mode: str
    scheduled_start: datetime
    scheduled_end: datetime
    meeting_link: Optional[str]
    status: str

    class Config:
        from_attributes = True

class EvaluationSubmit(BaseModel):
    interview_id: UUID
    rubric_ratings: Dict[str, int] # e.g. {"technical": 4, "problem_solving": 5, "communication": 4}
    comments: str
    recommendation: str = "hire" # strong_hire, hire, hold, reject

class ScorecardResponse(BaseModel):
    id: UUID
    application_id: UUID
    skill_matrix: Dict[str, Any]
    role_match_percentage: float
    final_decision: str
    decision_notes: Optional[str]

    class Config:
        from_attributes = True
