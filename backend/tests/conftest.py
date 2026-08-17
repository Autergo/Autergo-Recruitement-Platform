import asyncio
import pytest
from app.core.database import engine, Base

# Import all models
import app.models.organization
import app.models.drive
import app.models.assessment
import app.models.candidate
import app.models.attempt
import app.models.audit
import app.models.interview
import app.models.proctoring
import app.models.communication

@pytest.fixture(scope="session", autouse=True)
def anyio_backend():
    return "asyncio"

from app.core.database import AsyncSessionLocal
from app.models.organization import Organization, User
from app.core.security import get_password_hash
import uuid

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as db:
        org = Organization(name="Autergo Integration Test Org", slug=f"autergo-test-{uuid.uuid4().hex[:6]}")
        db.add(org)
        await db.flush()

        recruiter_user = User(
            tenant_id=org.id,
            email="recruiter@autergo.com",
            password_hash=get_password_hash("Recruiter@123"),
            full_name="Samantha Ray (Recruiter)",
            role="recruiter",
            is_active=True
        )
        admin_user = User(
            tenant_id=org.id,
            email="admin@autergo.com",
            password_hash=get_password_hash("Admin@123"),
            full_name="Alex Mercer (Admin)",
            role="admin",
            is_active=True
        )
        l1_user = User(
            tenant_id=org.id,
            email="l1@autergo.com",
            password_hash=get_password_hash("Interviewer@123"),
            full_name="David Chen (L1 Lead)",
            role="l1_interviewer",
            is_active=True
        )
        l2_user = User(
            tenant_id=org.id,
            email="l2@autergo.com",
            password_hash=get_password_hash("Interviewer@123"),
            full_name="Dr. Elena Rostova (L2 Principal)",
            role="l2_interviewer",
            is_active=True
        )
        db.add_all([recruiter_user, admin_user, l1_user, l2_user])
        await db.commit()
    yield
