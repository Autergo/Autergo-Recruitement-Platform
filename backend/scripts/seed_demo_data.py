import asyncio
import uuid
import sys
from datetime import datetime
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.organization import Organization, User
from app.models.drive import RecruitmentDrive, DriveStage
from app.models.assessment import Assessment
from app.models.candidate import Candidate, Application
from app.models.attempt import AssessmentAttempt, AttemptAnswer
from app.models.audit import AuditLog
from app.core.security import get_password_hash

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        org = Organization(name="Autergo Technologies", slug=f"autergo-{uuid.uuid4().hex[:6]}")
        db.add(org)
        await db.flush()

        # Create Users
        admin_user = User(
            tenant_id=org.id,
            email="admin@autergo.com",
            password_hash=get_password_hash("Admin@123"),
            full_name="Alex Mercer (Admin)",
            role="admin"
        )
        recruiter_user = User(
            tenant_id=org.id,
            email="recruiter@autergo.com",
            password_hash=get_password_hash("Recruiter@123"),
            full_name="Samantha Ray (Recruiter)",
            role="recruiter"
        )
        l1_user = User(
            tenant_id=org.id,
            email="l1@autergo.com",
            password_hash=get_password_hash("Interviewer@123"),
            full_name="David Chen (L1 Lead)",
            role="l1_interviewer"
        )
        l2_user = User(
            tenant_id=org.id,
            email="l2@autergo.com",
            password_hash=get_password_hash("Interviewer@123"),
            full_name="Dr. Elena Rostova (L2 Principal)",
            role="l2_interviewer"
        )
        db.add_all([admin_user, recruiter_user, l1_user, l2_user])
        await db.flush()

        # Create Recruitment Drive
        drive = RecruitmentDrive(
            tenant_id=org.id,
            title="Senior Full Stack Engineer 2026",
            job_title="Full Stack Software Engineer",
            job_description="Architect scalable Next.js and FastAPI cloud solutions.",
            eligibility_rules={
                "cutoff_percentage": 60.0,
                "send_rejection_emails": True,
                "onboarding_fields": ["experience_years", "referral_source", "phone"]
            },
            proctoring_config={
                "fullscreen": True,
                "tab_switch_detection": True,
                "mobile_visibility_check": True
            },
            created_by=recruiter_user.id,
            status="published"
        )
        db.add(drive)
        await db.flush()

        # Add Assessment with Questions
        q1_id = str(uuid.uuid4())
        q2_id = str(uuid.uuid4())
        assessment_questions = [
            {
                "id": q1_id,
                "title": "What is the average time complexity of searching in a balanced binary search tree?",
                "question_type": "single_mcq",
                "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                "correct_answer": "O(log n)",
                "marks": 10.0
            },
            {
                "id": q2_id,
                "title": "Write a function `solution(s)` that reverses string `s`.",
                "question_type": "coding",
                "boilerplate": "def solution(s):\n    pass",
                "correct_answer": "return s[::-1]",
                "marks": 10.0
            }
        ]

        assessment = Assessment(
            drive_id=drive.id,
            title="Senior Full Stack - Technical Assessment Paper",
            duration_minutes=45.0,
            sections=[{"name": "Technical", "questions": assessment_questions}],
            paper_versions={"A": assessment_questions}
        )
        db.add(assessment)
        await db.flush()

        # Seed Candidates in different stages
        # Candidate 1: Cleared Cutoff (In L1 Pool)
        c1 = Candidate(tenant_id=org.id, full_name="Aarav Sharma", email="aarav@example.com", phone="+91 9876543210")
        # Candidate 2: Cleared L1 (In L2 Pool)
        c2 = Candidate(tenant_id=org.id, full_name="Meera Patel", email="meera@example.com", phone="+91 9876543211")
        # Candidate 3: Failed Online Cutoff (< 60%)
        c3 = Candidate(tenant_id=org.id, full_name="Vikram Singh", email="vikram@example.com", phone="+91 9876543212")
        db.add_all([c1, c2, c3])
        await db.flush()

        # Application 1: L1 Eligible
        app1 = Application(
            tenant_id=org.id,
            drive_id=drive.id,
            candidate_id=c1.id,
            status="l1_eligible",
            invitation_token=f"tok_{uuid.uuid4().hex[:12]}",
            custom_field_values={
                "experience_years": 4.5,
                "referral_source": "LinkedIn",
                "test_score": 20.0,
                "test_total": 20.0,
                "test_percentage": 100.0,
                "device_type": "laptop",
                "proctoring_flags": {"tab_switches": 0}
            }
        )
        db.add(app1)
        await db.flush()

        att1 = AssessmentAttempt(application_id=app1.id, assessment_id=assessment.id, status="submitted", final_score=20.0, percentage=100.0, is_qualified=True)
        db.add(att1)
        await db.flush()
        ans1_1 = AttemptAnswer(attempt_id=att1.id, question_id=uuid.UUID(q1_id), submitted_answer={"answer": "O(log n)"}, is_correct=True, marks_awarded=10.0)
        ans1_2 = AttemptAnswer(attempt_id=att1.id, question_id=uuid.UUID(q2_id), submitted_answer={"answer": "return s[::-1]"}, is_correct=True, marks_awarded=10.0)
        db.add_all([ans1_1, ans1_2])

        # Application 2: L2 Eligible (Passed L1 with notes)
        app2 = Application(
            tenant_id=org.id,
            drive_id=drive.id,
            candidate_id=c2.id,
            status="l2_eligible",
            invitation_token=f"tok_{uuid.uuid4().hex[:12]}",
            custom_field_values={
                "experience_years": 6.0,
                "referral_source": "Employee Referral",
                "test_score": 20.0,
                "test_total": 20.0,
                "test_percentage": 100.0,
                "device_type": "laptop",
                "l1_interviewer_name": "David Chen (L1 Lead)",
                "l1_rating": 4.5,
                "l1_feedback": "Exceptional coding speed, clean edge case handling, and crisp architecture answers.",
                "l1_decision": "PASS",
                "l1_evaluated_at": datetime.utcnow().isoformat()
            }
        )
        db.add(app2)
        await db.flush()

        att2 = AssessmentAttempt(application_id=app2.id, assessment_id=assessment.id, status="submitted", final_score=20.0, percentage=100.0, is_qualified=True)
        db.add(att2)
        await db.flush()
        ans2_1 = AttemptAnswer(attempt_id=att2.id, question_id=uuid.UUID(q1_id), submitted_answer={"answer": "O(log n)"}, is_correct=True, marks_awarded=10.0)
        ans2_2 = AttemptAnswer(attempt_id=att2.id, question_id=uuid.UUID(q2_id), submitted_answer={"answer": "return s[::-1]"}, is_correct=True, marks_awarded=10.0)
        db.add_all([ans2_1, ans2_2])

        # Application 3: Rejected at Test
        app3 = Application(
            tenant_id=org.id,
            drive_id=drive.id,
            candidate_id=c3.id,
            status="test_rejected",
            invitation_token=f"tok_{uuid.uuid4().hex[:12]}",
            custom_field_values={
                "experience_years": 2.0,
                "referral_source": "Direct",
                "test_score": 0.0,
                "test_total": 20.0,
                "test_percentage": 0.0,
                "device_type": "mobile",
                "rejection_stage": "Online Test",
                "rejection_reason": "Scored 0.0% (Required cutoff: 60.0%)"
            }
        )
        db.add(app3)
        await db.commit()
        print("Demo seed data created successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
