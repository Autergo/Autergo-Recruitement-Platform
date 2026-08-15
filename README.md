# Autergo — Enterprise Recruitment & Assessment Platform

## Overview
Autergo is an AI-powered enterprise recruitment platform centered around the **Recruitment Drive** domain object. It delivers an end-to-end recruitment lifecycle from job definition, zero-account candidate assessment, multi-signal AI proctoring, real-time recruiter command center, structured interview evaluations, to Candidate 360 scorecards.

---

## 1. Quick Start

### Start Backing Infrastructure (Docker Compose)
```bash
docker compose up -d postgres redis minio
```

### Start Backend API Server
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python scripts/seed_demo_data.py
uvicorn app.main:app --reload --port 8000
```
- Swagger API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
- Recruiter Portal: `http://localhost:3000/login`
  - Demo Credentials: `admin@autergo.com` / `password123`
- Candidate Magic Assessment Link:
  - `http://localhost:3000/test/demo-invite-token-12345/verify`
  - OTP Code: `123456`

---

## 2. Architecture & Modules
- **Backend**: FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16 + pgvector, Redis 7, Celery, WebSockets.
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Monaco Code Editor, Recharts.
- **Proctoring**: Client-side MediaPipe edge AI inference + event-driven snapshot evidence capture + backend weighted Risk Engine.
- **Code Sandbox**: Multi-language isolated runner for Python, JavaScript, Java, C++, and SQL test assertions.
