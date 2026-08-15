import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.organization import Organization, User
from app.models.drive import RecruitmentDrive, DriveStage, CandidateFormField
from app.models.assessment import Assessment, Question
from app.models.candidate import Candidate, Application
from app.models.attempt import AssessmentAttempt, AttemptAnswer
from app.models.audit import AuditLog
from app.models.interview import Interview, InterviewEvaluation, CandidateScorecard
from app.models.proctoring import ProctorSession, ProctorEvent
from app.models.communication import CommunicationTemplate

async def seed_data():
    print("Connecting to database and creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select
        existing_org = await session.execute(select(Organization).limit(1))
        if existing_org.scalar_one_or_none():
            print("Database already contains data, all tables verified!")
            return

        # Create Demo Organization
        org = Organization(
            name="Autergo Demo Corp",
            slug="autergo-demo",
            settings={"theme": "dark", "retention_days": 90}
        )
        session.add(org)
        await session.flush()

        # Create Demo Admin User
        admin_user = User(
            tenant_id=org.id,
            email="admin@autergo.com",
            full_name="Admin Recruiter",
            password_hash=get_password_hash("password123"),
            role="org_admin"
        )
        session.add(admin_user)

        # Create Demo Drive
        drive = RecruitmentDrive(
            tenant_id=org.id,
            title="AI Software Engineer Campus 2026",
            job_title="AI Engineer",
            job_description="Design, develop and scale LLM pipelines and computer vision systems.",
            status="published",
            eligibility_rules={"min_cgpa": 7.0, "degree": "B.Tech Computer Science"},
            proctoring_config={"camera": True, "phone": True, "tab_switch_limit": 3},
            created_by=admin_user.id
        )
        session.add(drive)
        await session.flush()

        # Create Drive Stages
        stages = [
            DriveStage(drive_id=drive.id, stage_type="registration", sequence_order=1),
            DriveStage(drive_id=drive.id, stage_type="assessment", sequence_order=2),
            DriveStage(drive_id=drive.id, stage_type="technical_interview", sequence_order=3),
            DriveStage(drive_id=drive.id, stage_type="final_decision", sequence_order=4),
        ]
        session.add_all(stages)

        # Create Sample Questions
        q1 = Question(
            tenant_id=org.id,
            skill="Python",
            topic="Data Structures",
            difficulty="medium",
            question_type="single_mcq",
            title="Which Python data structure maintains sorted elements with O(log n) insertion?",
            content={"options": ["List", "Binary Search Tree / heapq", "Dictionary", "Set"]},
            correct_answer={"answer": "Binary Search Tree / heapq"},
            marks=1.0
        )
        q2 = Question(
            tenant_id=org.id,
            skill="Python",
            topic="String Manipulation",
            difficulty="easy",
            question_type="coding",
            title="Write a function `solution(s)` that reverses the string.",
            content={
                "boilerplate": "def solution(s):\n    pass",
                "test_cases": [
                    {"input": "hello", "expected_output": "olleh"},
                    {"input": "autergo", "expected_output": "ogretua"}
                ]
            },
            correct_answer={"solution": "return s[::-1]"},
            marks=5.0
        )
        session.add_all([q1, q2])

        # Create Demo Candidate and Magic Invitation Token
        candidate = Candidate(
            tenant_id=org.id,
            email="candidate@example.com",
            full_name="Priya Sharma"
        )
        session.add(candidate)
        await session.flush()

        application = Application(
            tenant_id=org.id,
            drive_id=drive.id,
            candidate_id=candidate.id,
            status="invited",
            invitation_token="demo-invite-token-12345"
        )
        session.add(application)

        await session.commit()
        print("Demo data seeded successfully!")
        print(f"Organization: {org.name} ({org.id})")
        print(f"Recruiter Login: admin@autergo.com / password123")
        print(f"Candidate Invitation URL: /test/demo-invite-token-12345/verify")

if __name__ == "__main__":
    asyncio.run(seed_data())
