from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

class QuestionBase(BaseModel):
    skill: str
    topic: str
    difficulty: str = "medium"
    question_type: str = "single_mcq" # single_mcq, multiple_mcq, true_false, coding, sql, short_answer
    title: str
    content: Dict[str, Any] = {}
    correct_answer: Dict[str, Any] = {}
    marks: float = 1.0
    negative_marks: float = 0.0
    expected_time_sec: int = 60

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: UUID
    tenant_id: UUID
    is_ai_generated: bool
    is_human_verified: bool
    version: int
    created_at: datetime

    class Config:
        from_attributes = True

class AIGenerateRequest(BaseModel):
    role: str
    experience_level: str = "0-2 years"
    difficulty: str = "medium"
    question_count: int = 10
    skill_distribution: Dict[str, int] = Field(
        default={"Python": 40, "SQL": 30, "DSA": 30},
        description="Percentage breakdown per skill"
    )
