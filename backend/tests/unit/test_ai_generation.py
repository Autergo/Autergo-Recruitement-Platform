import pytest
from app.services.ai_service import AIService
from app.schemas.question import AIGenerateRequest
import uuid

@pytest.mark.asyncio
async def test_ai_question_generation():
    tenant_id = uuid.uuid4()
    req = AIGenerateRequest(
        role="Senior Backend Python Engineer",
        difficulty="medium",
        skill_distribution={"Python": 50, "SQL": 50}
    )
    questions = await AIService.generate_questions(tenant_id, req)
    assert len(questions) >= 2
    assert any(q["skill"] == "Python" for q in questions)
    assert any(q["skill"] == "SQL" for q in questions)
    assert all(q["is_ai_generated"] is True for q in questions)
