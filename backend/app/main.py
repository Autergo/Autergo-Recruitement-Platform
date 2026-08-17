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
@app.get("/health")
@app.get("/api/v1/health")
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
