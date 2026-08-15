from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.ws_manager import ws_manager
from app.api.v1 import auth, drives, public, questions, interviews, communications

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Autergo Platform API"}
