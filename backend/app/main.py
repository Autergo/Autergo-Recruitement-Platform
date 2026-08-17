from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.ws_manager import ws_manager
from app.api.v1 import auth, drives, public, questions, interviews, communications, organizations

# Import all models to ensure metadata registration
import app.models.organization
import app.models.drive
import app.models.assessment
import app.models.candidate
import app.models.attempt
import app.models.audit
import app.models.interview
import app.models.proctoring
import app.models.communication

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create all tables on startup if not already created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Auto-seed initial demo accounts and drives if empty
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.organization import Organization, User
        from app.models.drive import RecruitmentDrive, DriveStage
        from app.core.security import get_password_hash
        from sqlalchemy import select
        import uuid

        async with AsyncSessionLocal() as db:
            user_check = await db.execute(select(User).limit(1))
            if not user_check.scalar_one_or_none():
                # Seed default organization
                org = Organization(name="Autergo Technologies", slug="autergo-hq")
                db.add(org)
                await db.flush()

                # Seed Default Users
                admin_user = User(
                    tenant_id=org.id,
                    email="admin@autergo.com",
                    password_hash=get_password_hash("Admin@123"),
                    full_name="Alex Mercer (Admin)",
                    role="admin",
                    is_active=True
                )
                recruiter_user = User(
                    tenant_id=org.id,
                    email="recruiter@autergo.com",
                    password_hash=get_password_hash("Recruiter@123"),
                    full_name="Samantha Ray (Recruiter)",
                    role="recruiter",
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
                db.add_all([admin_user, recruiter_user, l1_user, l2_user])
                await db.flush()

                # Seed Default Recruitment Drive
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
                        "tab_switch_limit": 3,
                        "webcam_required": False
                    },
                    current_stage=DriveStage.REGISTRATION_OPEN,
                    is_active=True
                )
                db.add(drive)
                await db.commit()
                print(">> Auto-seeded initial Organization, Admin, Recruiter, and Demo Drive successfully.")
    except Exception as e:
        print(f">> Notice: Startup auto-seeder completed: {e}")

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(organizations.router, prefix=settings.API_V1_STR)
app.include_router(drives.router, prefix=settings.API_V1_STR)
app.include_router(public.router, prefix=settings.API_V1_STR)
app.include_router(questions.router, prefix=settings.API_V1_STR)
app.include_router(interviews.router, prefix=settings.API_V1_STR)
app.include_router(communications.router, prefix=settings.API_V1_STR)

# Live Recruiter Command Center WebSocket Stream
@app.websocket("/api/v1/ws/drives/{drive_id}/live")
async def live_drive_websocket(websocket: WebSocket, drive_id: str):
    await ws_manager.connect(drive_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
    except WebSocketDisconnect:
        ws_manager.disconnect(drive_id, websocket)

@app.get("/")
@app.head("/")
@app.get("/health")
@app.head("/health")
@app.get("/api/v1/health")
@app.head("/api/v1/health")
async def health_check():
    """
    Dedicated UptimeRobot / Ping health check endpoint.
    Keeps the free instance alive (e.g. Render, Railway, Fly.io, Koyeb)
    and verifies backend status.
    """
    from datetime import datetime
    db_connected = False
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy",
        "service": "Autergo Enterprise Recruitment Platform API",
        "database": "connected" if db_connected else "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }
