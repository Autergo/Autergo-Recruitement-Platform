import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User
from app.models.assessment import Question
from app.schemas.question import QuestionCreate, QuestionResponse, AIGenerateRequest
from app.services.ai_service import AIService

router = APIRouter(prefix="/questions", tags=["Question Bank & AI Generation"])

@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    skill: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Question).where(Question.tenant_id == current_user.tenant_id)
    if skill:
        stmt = stmt.where(Question.skill.ilike(f"%{skill}%"))
    if difficulty:
        stmt = stmt.where(Question.difficulty == difficulty)
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    req: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter"]))
):
    question = Question(
        tenant_id=current_user.tenant_id,
        skill=req.skill,
        topic=req.topic,
        difficulty=req.difficulty,
        question_type=req.question_type,
        title=req.title,
        content=req.content,
        correct_answer=req.correct_answer,
        marks=req.marks,
        negative_marks=req.negative_marks,
        expected_time_sec=req.expected_time_sec,
        is_ai_generated=False,
        is_human_verified=True
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question

@router.post("/generate-ai", response_model=List[QuestionResponse])
async def generate_ai_questions(
    req: AIGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter"]))
):
    raw_questions = await AIService.generate_questions(tenant_id=current_user.tenant_id, req=req)
    saved_questions = []

    for q_data in raw_questions:
        q = Question(
            tenant_id=current_user.tenant_id,
            skill=q_data["skill"],
            topic=q_data["topic"],
            difficulty=q_data["difficulty"],
            question_type=q_data["question_type"],
            title=q_data["title"],
            content=q_data["content"],
            correct_answer=q_data["correct_answer"],
            marks=q_data["marks"],
            negative_marks=q_data["negative_marks"],
            expected_time_sec=q_data["expected_time_sec"],
            is_ai_generated=True,
            is_human_verified=False
        )
        db.add(q)
        saved_questions.append(q)

    await db.commit()
    for q in saved_questions:
        await db.refresh(q)

    return saved_questions
