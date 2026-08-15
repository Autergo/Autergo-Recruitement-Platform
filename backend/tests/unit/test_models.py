import pytest
from app.models.organization import User, Organization
from app.models.drive import RecruitmentDrive
from app.models.candidate import Candidate, Application
from app.models.assessment import Assessment, Question
from app.models.attempt import AssessmentAttempt
from app.models.proctoring import ProctorSession, ProctorEvent

def test_models_instantiation():
    org = Organization(name="Test Org", slug="test-org")
    assert org.name == "Test Org"

    user = User(tenant_id=org.id, email="recruiter@test.com", password_hash="hash", full_name="Test Recruiter", role="recruiter")
    assert user.email == "recruiter@test.com"
    assert user.role == "recruiter"

    drive = RecruitmentDrive(tenant_id=org.id, title="Campus 2026", job_title="Engineer", job_description="Desc", status="draft")
    assert drive.status == "draft"

    question = Question(tenant_id=org.id, skill="Python", topic="DSA", difficulty="medium", question_type="single_mcq", title="Question?", marks=1.0)
    assert question.marks == 1.0
