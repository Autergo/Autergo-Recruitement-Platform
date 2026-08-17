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

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
