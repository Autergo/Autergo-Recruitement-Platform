# Implementation Plan: Autergo Enterprise Recruitment Platform (V1 MVP)

**Branch**: `001-autergo-recruitment-platform` | **Date**: 2026-08-14 | **Spec**: [spec.md](file:///d:/Projects/Autergo/Recruitement%20system/specs/001-autergo-recruitment-platform/spec.md)

**Input**: Feature specification from `/specs/001-autergo-recruitment-platform/spec.md`

## Summary

Autergo is an AI-assisted enterprise recruitment platform centered around the **Recruitment Drive** domain object. The architecture is designed as a **Modular Monolith** using **FastAPI (Python 3.11+)** on the backend and **Next.js 14+ (TypeScript / Tailwind CSS)** on the frontend, backed by **PostgreSQL 16 with pgvector**, **Redis 7**, and **Object Storage**. The system delivers end-to-end capabilities: recruiter drive builder wizard, candidate zero-account magic token onboarding, multi-section assessments with multi-language sandboxed code execution, client-side computer vision proctoring with event-driven evidence capture, real-time command center over WebSockets, AI-assisted interview evaluations, Candidate 360 profiles, automated communications, and immutable audit logs.

## Technical Context

**Language/Version**: Python 3.11+ (Backend), TypeScript 5+ / Node.js 18+ (Frontend)

**Primary Dependencies**:
- Backend: FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), Alembic, Celery / Redis, pgvector-python, WebSockets, PyJWT, Passlib (bcrypt), MediaPipe / ONNX Runtime (CV inference).
- Frontend: Next.js 14+ (App Router), React 18+, Tailwind CSS, Lucide Icons, Monaco Editor (Coding assessment), Recharts (Analytics & Radar charts), Socket.io-client / Native WebSockets.

**Storage**: PostgreSQL 16 (Relational & pgvector embeddings), Redis 7 (Cache, sessions, live telemetry buffering, Celery message broker), S3-compatible Object Storage (MinIO / AWS S3 for resumes & proctoring clips).

**Testing**: Pytest (Unit & Integration), pytest-asyncio, HTTPX (API tests), Jest / React Testing Library, Playwright (E2E workflows).

**Target Platform**: Linux Server / Cloud Containers (Docker), Modern Desktop & Laptop Browsers (Chrome, Edge, Firefox, Safari).

**Project Type**: Full-Stack Web Application (Modular Monolith backend + Next.js web application).

**Performance Goals**:
- Support 5,000 concurrent candidate test submissions without data loss or request timeouts.
- Real-time proctoring alert delivery to recruiter dashboard in <5 seconds.
- Sandboxed code execution round-trip latency <2.5 seconds.
- Incremental answer auto-save latency <200ms p95.

**Constraints**:
- Single-device active candidate session binding with strict 15-minute recovery grace period.
- Zero client-side exposure of answer keys or hidden unit tests.
- Multi-signal proctoring without autonomous candidate disqualification.

**Scale/Scope**:
- V1 MVP: 11 domain modules, 18 core relational tables, 51 functional requirements, 8 user journeys.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design: ALL GATES PASS.*

| Principle / Rule | Compliance Status | Implementation Evidence |
|---|---|---|
| **I. Enterprise Security & Zero Trust Architecture (NON-NEGOTIABLE)** | **PASS** | AES-256 at rest, TLS 1.3 in transit, strict tenant_id scoping on every DB query, RBAC enforcement on every API endpoint, immutable audit log table capturing all state changes. |
| **II. AI Transparency, Evidence-Based Intelligence & Auditability** | **PASS** | AI never makes autonomous hiring or cheating decisions. All AI outputs carry model version, confidence scores, and raw evidence links. Human recruiter/interviewer ratings are authoritative. |
| **III. High Scalability & Durable Operations** | **PASS** | Hybrid scoring architecture (synchronous fast path for objective test submissions + Celery asynchronous workers for heavy evaluation/analytics). Zero data loss guarantee via incremental answer auto-saving. |
| **IV. Frictionless Candidate Experience & Multi-Signal Integrity** | **PASS** | Zero-account entry via magic invitation token + OTP. Multi-signal proctoring (camera, tab focus, audio) aggregated into reviewable risk score; never single-signal auto-banning. |
| **V. Automated Comprehensive Testing & Continuous Quality Gates** | **PASS** | Pytest unit/integration suites, contract OpenAPI validations, and end-to-end Playwright journeys specified in quickstart.md. |

## Project Structure

### Documentation (this feature)

```text
specs/001-autergo-recruitment-platform/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output: Architecture & tech decisions
├── data-model.md        # Phase 1 output: Complete PostgreSQL schema & entity relationships
├── quickstart.md        # Phase 1 output: Step-by-step verification & testing scenarios
├── contracts/           # Phase 1 output: Interface definitions
│   ├── openapi.yaml     # REST API specification
│   └── websockets.md    # Real-time WebSocket streaming protocol
├── checklists/
│   └── requirements.md  # Quality validation checklist
└── spec.md              # Feature specification
```

### Source Code (repository root layout)

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py              # Login, token refresh, recruiter RBAC
│   │       ├── organizations.py     # Organization & tenant settings
│   │       ├── drives.py            # Recruitment drive CRUD, stages, publish
│   │       ├── candidates.py        # Candidate pools, CSV import, status tracking
│   │       ├── assessments.py       # Assessment builder, paper versions A/B/C/D
│   │       ├── questions.py         # Question bank & AI question generator
│   │       ├── public.py            # Candidate zero-account test runner endpoints
│   │       ├── proctoring.py        # Telemetry ingestion, risk scoring & adjudication
│   │       ├── interviews.py        # Interview scheduling & rubric evaluations
│   │       ├── scorecards.py        # Candidate 360 profiles & final hiring decisions
│   │       ├── communications.py    # Email templates & trigger automation
│   │       ├── analytics.py         # Drive funnels, score distributions & reports
│   │       ├── audit.py             # Immutable audit log query endpoints
│   │       └── ws.py                # WebSocket endpoints for live dashboard & telemetry
│   ├── core/
│   │   ├── config.py                # Environment settings & secrets
│   │   ├── database.py              # SQLAlchemy async session & connection pool
│   │   ├── security.py              # JWT encoding/decoding, password hashing
│   │   ├── redis.py                 # Redis client for caching & session state
│   │   └── celery_app.py            # Celery worker configuration
│   ├── models/                      # SQLAlchemy ORM model definitions (18 entities)
│   ├── schemas/                     # Pydantic v2 validation schemas
│   ├── services/                    # Core business logic & domain engines
│   │   ├── scoring_engine.py        # Hybrid synchronous & async scoring service
│   │   ├── risk_engine.py           # Multi-signal proctoring suspicion calculation
│   │   ├── ai_service.py            # LLM question generation & interview assistance
│   │   ├── sandbox_service.py       # Multi-language code execution runner
│   │   └── communication_service.py # Email dispatch & template rendering
│   └── workers/                     # Asynchronous background tasks
│       ├── scoring_tasks.py
│       └── ai_tasks.py
├── alembic/                         # Database migration scripts
├── tests/                           # Pytest test suite (unit, integration, contracts)
├── requirements.txt
└── Dockerfile

frontend/
├── src/
│   ├── app/                         # Next.js 14 App Router
│   │   ├── (auth)/login/            # Recruiter login page
│   │   ├── (recruiter)/             # Recruiter portal layout
│   │   │   ├── dashboard/           # Drives overview & upcoming interviews
│   │   │   ├── drives/
│   │   │   │   ├── create/          # 8-step drive creation wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # Drive details & candidate pipeline
│   │   │   │       ├── live/        # Real-time Drive Command Center
│   │   │   │       └── candidate360/# Unified Candidate 360 profile
│   │   │   ├── questions/           # Question Bank & AI Question Generator
│   │   │   ├── interviews/          # Interview schedule & evaluation rubrics
│   │   │   └── settings/            # Organization & RBAC management
│   │   └── (candidate)/             # Frictionless candidate portal
│   │       └── test/[token]/
│   │           ├── verify/          # OTP & identity verification
│   │           ├── readiness/       # Camera, mic, browser system check
│   │           └── take/            # Timed assessment test runner & code editor
│   ├── components/
│   │   ├── assessment/              # MCQ, Code Editor (Monaco), Timer widgets
│   │   ├── proctoring/              # Client-side MediaPipe webcam tracker
│   │   ├── live-dashboard/          # Real-time counter cards, alert feeds
│   │   └── ui/                      # Accessible design system components
│   ├── hooks/                       # useWebSocket, useSessionTimer, useAutoSave
│   └── lib/                         # API client, telemetry utilities
├── package.json
└── tailwind.config.ts
```

**Structure Decision**: Selected the **Web Application structure** (`backend/` FastAPI + `frontend/` Next.js) reflecting the modular monolith architecture determined in Phase 0 Research and the product blueprints.

## Complexity Tracking

*No constitutional violations identified. No unjustified architectural complexity.*

| Pattern / Component | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| **Modular Monolith instead of Microservices** | Simplifies deployment, ensures relational integrity, and maximizes velocity for V1 MVP. | Microservices create unnecessary distributed overhead at initial scale. |
| **Hybrid Synchronous/Async Scoring** | Protects API from gateway timeouts during peak 5,000-submission bursts while giving immediate acknowledgment. | Full synchronous scoring causes 504 timeouts; full async delays candidate feedback. |
| **Client-Side Edge Inference for CV** | Reduces backend GPU/bandwidth demands by >90% for proctoring. | Server-side video streaming for 5,000 concurrent candidates is cost-prohibitive. |
