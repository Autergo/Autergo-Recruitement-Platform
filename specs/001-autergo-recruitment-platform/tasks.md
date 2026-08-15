---
description: "Dependency-ordered implementation tasks for Autergo Enterprise Recruitment Platform"
---

# Tasks: Autergo Enterprise Recruitment Platform (V1 MVP)

**Input**: Design documents from `/specs/001-autergo-recruitment-platform/`
**Prerequisites**: [`plan.md`](file:///d:/Projects/Autergo/Recruitement%20system/specs/001-autergo-recruitment-platform/plan.md), [`spec.md`](file:///d:/Projects/Autergo/Recruitement%20system/specs/001-autergo-recruitment-platform/spec.md), [`data-model.md`](file:///d:/Projects/Autergo/Recruitement%20system/specs/001-autergo-recruitment-platform/data-model.md), [`contracts/`](file:///d:/Projects/Autergo/Recruitement%20system/specs/001-autergo-recruitment-platform/contracts/)

## Format: `[TaskID] [P?] [Story?] Description with file path`
- **[P]**: Parallelizable task (independent files/modules)
- **[Story]**: Maps to user stories [US1] through [US8] from `spec.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structure, dependency management, and configuration.

- [x] T001 Initialize backend project structure with FastAPI, requirements.txt, and Dockerfile in `backend/`
- [x] T002 Initialize frontend project with Next.js 14, TypeScript, Tailwind CSS, and package.json in `frontend/`
- [x] T003 [P] Configure environment settings and secret loading in `backend/app/core/config.py`
- [x] T004 [P] Setup linting, formatting, and test configurations (pytest.ini, ruff, eslint) in `backend/pytest.ini` and `frontend/.eslintrc.json`
- [x] T005 Setup docker compose configuration for PostgreSQL (with pgvector), Redis, and MinIO in `docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database connections, ORM base models, auth framework, and real-time infrastructure.

- [x] T006 Setup asynchronous SQLAlchemy 2.0 engine, session factory, and base model in `backend/app/core/database.py`
- [x] T007 [P] Setup Redis connection pool and caching helper utilities in `backend/app/core/redis.py`
- [x] T008 [P] Implement JWT security utilities, token generation, and password hashing in `backend/app/core/security.py`
- [ ] T009 Create Alembic database migrations environment with pgvector support in `backend/alembic/`
- [x] T010 [P] Implement audit logging middleware and service in `backend/app/services/audit_service.py`
- [ ] T011 [P] Implement Celery worker configuration and message broker connection in `backend/app/core/celery_app.py`
- [x] T012 [P] Setup API router registration and global exception handlers in `backend/app/main.py`
- [ ] T013 Setup base UI layout, theme provider, and accessible navigation shell in `frontend/src/app/layout.tsx`
- [ ] T014 [P] Implement frontend API client with auth interceptors and error handling in `frontend/src/lib/api-client.ts`

**Checkpoint**: Core foundation ready — User stories can now be implemented.

---

## Phase 3: User Story 8 — Organization, Multi-Tenancy, RBAC & Audit (Priority: P1) 🎯

**Goal**: Tenant isolation, user management, role-based access control, and immutable audit logging.
**Independent Test**: Register tenant, create users with roles (Admin, Recruiter, Interviewer), verify permission barriers, and confirm audit trails.

- [x] T015 [P] [US8] Create Organization and User SQLAlchemy ORM models in `backend/app/models/organization.py` and `backend/app/models/user.py`
- [x] T016 [P] [US8] Create AuditLog SQLAlchemy model in `backend/app/models/audit.py`
- [x] T017 [P] [US8] Create Pydantic validation schemas for Auth, Users, and Organizations in `backend/app/schemas/auth.py` and `backend/app/schemas/user.py`
- [x] T018 [US8] Implement Authentication and RBAC dependency injection guards in `backend/app/api/v1/auth.py`
- [x] T019 [US8] Implement Organization and User management endpoints in `backend/app/api/v1/organizations.py` and `backend/app/api/v1/users.py`
- [x] T020 [US8] Implement Audit log query endpoints in `backend/app/api/v1/audit.py`
- [x] T021 [P] [US8] Create Recruiter Login and Organization Settings pages in `frontend/src/app/(auth)/login/page.tsx` and `frontend/src/app/(recruiter)/settings/page.tsx`
- [x] T022 [US8] Write unit and integration tests for tenant isolation and RBAC guards in `backend/tests/integration/test_auth_rbac.py`

**Checkpoint**: Multi-tenant RBAC and audit infrastructure verified.

---

## Phase 4: User Story 1 — Recruiter Creates & Publishes Recruitment Drive (Priority: P1) 🎯 MVP

**Goal**: Full 8-step wizard for configuring jobs, eligibility criteria, custom candidate fields, stages, and publishing drives.
**Independent Test**: Complete drive creation wizard, publish drive, verify public invitation link generation, and import candidate CSV.

- [x] T023 [P] [US1] Create RecruitmentDrive, DriveStage, and CandidateFormField ORM models in `backend/app/models/drive.py`
- [x] T024 [P] [US1] Create Pydantic schemas for Drive creation, stages, and eligibility in `backend/app/schemas/drive.py`
- [x] T025 [US1] Implement Drive CRUD, stage ordering, and publish endpoints in `backend/app/api/v1/drives.py`
- [x] T026 [P] [US1] Create Candidate and Application models in `backend/app/models/candidate.py`
- [x] T027 [US1] Implement CSV bulk candidate import endpoint with email queueing in `backend/app/api/v1/candidates.py`
- [x] T028 [P] [US1] Build Recruiter Dashboard Overview and active drives listing in `frontend/src/app/(recruiter)/dashboard/page.tsx`
- [x] T029 [US1] Build 8-Step Drive Creation Wizard UI in `frontend/src/app/(recruiter)/drives/create/page.tsx`
- [x] T030 [P] [US1] Build Drive Pipeline and Candidate Management table in `frontend/src/app/(recruiter)/drives/[id]/page.tsx`
- [x] T031 [US1] Write integration tests for Drive creation, validation, and CSV candidate import in `backend/tests/integration/test_drives.py`

**Checkpoint**: Recruiter can create, configure, and publish drives and import candidates.

---

## Phase 5: User Story 2 — Candidate Takes Assessment (Zero-Account Entry) (Priority: P1) 🎯

**Goal**: Frictionless candidate onboarding via magic token + OTP, system check, timed assessment runner with auto-save and 15-minute disconnect recovery.
**Independent Test**: Verify magic token, pass camera/mic readiness check, answer questions, test session resume after disconnect, and submit test.

- [x] T032 [P] [US2] Create AssessmentAttempt and AttemptAnswer ORM models in `backend/app/models/attempt.py`
- [x] T033 [P] [US2] Create Pydantic schemas for verification, session bootstrap, and answers in `backend/app/schemas/public_test.py`
- [x] T034 [US2] Implement token verification and OTP generation endpoints in `backend/app/api/v1/public.py`
- [x] T035 [US2] Implement Assessment session bootstrap, active session binding, and 15-minute disconnect recovery logic in `backend/app/services/session_service.py`
- [x] T036 [US2] Implement Incremental answer auto-save endpoint (`/api/v1/public/assessment/answers/autosave`) in `backend/app/api/v1/public.py`
- [x] T037 [US2] Implement Final assessment submission endpoint with session locking in `backend/app/api/v1/public.py`
- [x] T038 [P] [US2] Build Candidate Magic Link Verification and OTP page in `frontend/src/app/(candidate)/test/[token]/verify/page.tsx`
- [x] T039 [US2] Build Interactive System Readiness Check UI (Webcam, Mic, Browser) in `frontend/src/app/(candidate)/test/[token]/readiness/page.tsx`
- [x] T040 [US2] Build Candidate Assessment Runner (Question navigation, timer, auto-save hook) in `frontend/src/app/(candidate)/test/[token]/take/page.tsx`
- [x] T041 [US2] Write integration tests for Candidate session state machine and disconnect recovery in `backend/tests/integration/test_candidate_session.py`

**Checkpoint**: Candidate can securely verify, take a timed assessment, resume on disconnect, and submit.

---

## Phase 6: User Story 5 — Assessment Builder, Question Bank & Sandboxed Code Execution (Priority: P2)

**Goal**: Question bank management, multi-language sandboxed code execution, AI question generation, and paper builder with versions A/B/C/D.
**Independent Test**: Create questions across skills/types, generate questions with AI, run code tests in sandbox, and assemble equivalent papers.

- [x] T042 [P] [US5] Create Question and Assessment ORM models in `backend/app/models/question.py` and `backend/app/models/assessment.py`
- [x] T043 [P] [US5] Create Pydantic schemas for Question Bank, AI generation, and code execution in `backend/app/schemas/question.py`
- [x] T044 [US5] Implement Question Bank CRUD and filtering endpoints in `backend/app/api/v1/questions.py`
- [x] T045 [US5] Implement AI Question Generator with duplicate similarity and validation in `backend/app/services/ai_service.py` and `backend/app/api/v1/questions.py`
- [x] T046 [US5] Implement Sandboxed Code Execution Service supporting Python, JavaScript, Java, C++, and SQL test runners in `backend/app/services/sandbox_service.py`
- [x] T047 [US5] Implement Code execution endpoint (`/api/v1/public/assessment/code/execute`) in `backend/app/api/v1/public.py`
- [ ] T048 [US5] Implement Assessment paper builder and equivalent version generator (A/B/C/D) in `backend/app/api/v1/assessments.py`
- [x] T049 [P] [US5] Build Question Bank and AI Question Generator UI in `frontend/src/app/(recruiter)/questions/page.tsx`
- [ ] T050 [US5] Build Monaco Code Editor component with test case output panel in `frontend/src/components/assessment/code-editor.tsx`
- [x] T051 [US5] Write integration tests for Sandboxed code execution and AI question generator in `backend/tests/integration/test_code_sandbox.py`

**Checkpoint**: Assessment builder, AI generation, and multi-language code testing fully functional.

---

## Phase 7: User Story 4 — AI-Powered Multi-Signal Proctoring & Risk Engine (Priority: P2)

**Goal**: Client-side edge CV inference, telemetry streaming, event-driven snapshot captures, backend risk scoring, and reviewer timeline adjudication.
**Independent Test**: Stream proctoring events, verify risk score aggregation, upload snapshot media on anomalies, and adjudicate flags.

- [ ] T052 [P] [US4] Create ProctorSession and ProctorEvent ORM models in `backend/app/models/proctoring.py`
- [ ] T053 [P] [US4] Create Pydantic schemas for Proctoring Telemetry and Adjudication in `backend/app/schemas/proctoring.py`
- [ ] T054 [US4] Implement Client-Side MediaPipe webcam face and anomaly tracker in `frontend/src/components/proctoring/webcam-tracker.tsx`
- [ ] T055 [US4] Implement Proctoring Telemetry Ingestion endpoint in `backend/app/api/v1/public.py`
- [ ] T056 [US4] Implement Multi-Signal Risk Engine (weighted anomaly aggregation) in `backend/app/services/risk_engine.py`
- [ ] T057 [US4] Implement Event-Driven Evidence Media upload and signed URL service in `backend/app/services/storage_service.py`
- [ ] T058 [US4] Implement Reviewer Adjudication endpoint (Confirm/Ignore/Review) in `backend/app/api/v1/proctoring.py`
- [ ] T059 [P] [US4] Build Suspicion Timeline and Evidence Review Modal in `frontend/src/components/proctoring/suspicion-timeline.tsx`
- [ ] T060 [US4] Write unit and integration tests for Risk Engine scoring and adjudication in `backend/tests/unit/test_risk_engine.py`

**Checkpoint**: Multi-signal proctoring, event-driven media capture, and human review active.

---

## Phase 8: User Story 3 — Live Drive Command Center & Real-Time Operations (Priority: P1) 🎯

**Goal**: Real-time operational dashboard over WebSockets with candidate status counters, anomaly alert stream, and drive control actions.
**Independent Test**: Connect to live drive feed via WebSocket, simulate test events, verify live UI updates in <5s, and issue pause/extend commands.

- [ ] T061 [P] [US3] Implement WebSocket connection manager with Redis Pub/Sub backend in `backend/app/core/ws_manager.py`
- [ ] T062 [US3] Implement Live Drive WebSocket endpoint (`/api/v1/ws/drives/{drive_id}/live`) in `backend/app/api/v1/ws.py`
- [ ] T063 [P] [US3] Implement HTTP long-polling fallback endpoint in `backend/app/api/v1/drives.py`
- [ ] T064 [US3] Implement Drive Control Actions (Pause, Resume, Extend Time, Terminate Candidate) in `backend/app/api/v1/drives.py`
- [ ] T065 [P] [US3] Create frontend real-time WebSocket hook with exponential-backoff polling fallback in `frontend/src/hooks/use-live-drive.ts`
- [ ] T066 [US3] Build Live Drive Command Center UI (Counters, progress bar, alert stream, control toolbar) in `frontend/src/app/(recruiter)/drives/[id]/live/page.tsx`
- [ ] T067 [US3] Write integration tests for WebSocket pub/sub and drive control operations in `backend/tests/integration/test_websockets.py`

**Checkpoint**: Recruiter Command Center delivers sub-5s live visibility and drive control.

---

## Phase 9: User Story 6 — Interview Engine, AI Assistance & Candidate 360 (Priority: P2)

**Goal**: Multi-round interview scheduling, AI-suggested questions based on score gaps, structured rubric evaluations, and unified Candidate 360 profile.
**Independent Test**: Shortlist candidate, schedule technical interview, view AI question suggestions, submit evaluation, and record final hiring decision.

- [x] T068 [P] [US6] Create Interview, InterviewEvaluation, and CandidateScorecard ORM models in `backend/app/models/interview.py` and `backend/app/models/scorecard.py`
- [x] T069 [P] [US6] Create Pydantic schemas for Interview scheduling, rubrics, and scorecards in `backend/app/schemas/interview.py`
- [x] T070 [US6] Implement Interview scheduling and assignment endpoints in `backend/app/api/v1/interviews.py`
- [x] T071 [US6] Implement AI Question Suggester and Candidate Summarizer in `backend/app/services/ai_service.py`
- [x] T072 [US6] Implement Structured Rubric Evaluation submission and scorecard aggregation in `backend/app/api/v1/evaluations.py`
- [x] T073 [US6] Implement Final hiring decision endpoints (Strong Hire / Hire / Hold / Reject) in `backend/app/api/v1/scorecards.py`
- [x] T074 [P] [US6] Build Interview Management and Rubric Evaluation Form in `frontend/src/app/(recruiter)/interviews/page.tsx`
- [x] T075 [US6] Build Unified Candidate 360 Profile with competency radar charts in `frontend/src/app/(recruiter)/drives/[id]/candidate360/page.tsx`
- [x] T076 [US6] Write integration tests for Interview evaluation and Candidate 360 aggregation in `backend/tests/integration/test_interviews.py`

**Checkpoint**: Interview management, AI-assisted questioning, and Candidate 360 scorecards complete.

---

## Phase 10: User Story 7 — Automated Communication Workflows & Analytics (Priority: P3)

**Goal**: Event-triggered email dispatch with variable validation, drive funnel metrics, score distributions, and question intelligence analytics.
**Independent Test**: Configure templates, trigger lifecycle events, verify email deliveries, and check analytics funnel charts.

- [x] T077 [P] [US7] Create CommunicationTemplate ORM model in `backend/app/models/communication.py`
- [x] T078 [P] [US7] Create Pydantic schemas for Email Templates and Analytics reports in `backend/app/schemas/communication.py` and `backend/app/schemas/analytics.py`
- [x] T079 [US7] Implement Communication Template CRUD and variable validation service in `backend/app/services/communication_service.py`
- [x] T080 [US7] Implement Event-driven Celery background email worker in `backend/app/workers/communication_tasks.py`
- [x] T081 [US7] Implement Drive Funnel and Question Analytics aggregation endpoints in `backend/app/api/v1/analytics.py`
- [x] T082 [P] [US7] Build Email Template Manager in `frontend/src/app/(recruiter)/drives/[id]/communications/page.tsx`
- [x] T083 [US7] Build Analytics Dashboard (Funnel drop-off, score histograms, question difficulty indices) in `frontend/src/app/(recruiter)/drives/[id]/analytics/page.tsx`
- [x] T084 [US7] Write integration tests for Communication variable rendering and Analytics aggregation in `backend/tests/integration/test_analytics.py`

**Checkpoint**: Automated email pipelines and recruitment analytics active.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: System integration, end-to-end performance validation, security hardening, and documentation.

- [x] T085 [P] Create database seeding script for demo organizations, drives, questions, and candidates in `backend/scripts/seed_demo_data.py`
- [x] T086 Configure rate limiting middleware with Redis on public endpoints in `backend/app/core/rate_limit.py`
- [x] T087 [P] Implement CORS, CSRF, and security response headers in `backend/app/main.py`
- [x] T088 Execute full end-to-end verification scenarios per `specs/001-autergo-recruitment-platform/quickstart.md`
- [x] T089 [P] Update API documentation and deployment guide in `README.md`

---

## Dependencies & Execution Order

### Phase Flow
```text
Phase 1: Setup ──► Phase 2: Foundational (BLOCKS all stories)
                         │
         ┌───────────────┼────────────────────────┐
         ▼               ▼                        ▼
  Phase 3: US8 (P1)  Phase 4: US1 (P1 MVP)  Phase 5: US2 (P1)
  (Org & RBAC)       (Drive Builder)        (Candidate Test)
         │               │                        │
         └───────────────┼────────────────────────┘
                         │
         ┌───────────────┼────────────────────────┐
         ▼               ▼                        ▼
  Phase 6: US5 (P2)  Phase 7: US4 (P2)      Phase 8: US3 (P1)
  (Questions/Code)   (Proctoring)           (Live Dashboard)
         │               │                        │
         └───────────────┼────────────────────────┘
                         │
         ┌───────────────┴────────────────────────┐
         ▼                                        ▼
  Phase 9: US6 (P2)                        Phase 10: US7 (P3)
  (Interviews & 360)                       (Emails & Analytics)
                         │
                         ▼
             Phase 11: Polish & Hardening
```

### Parallel Opportunities

- **Phase 1 (Setup)**: `T003`, `T004`, `T005` can run in parallel.
- **Phase 2 (Foundational)**: `T007`, `T008`, `T010`, `T011`, `T012`, `T014` can run concurrently once database models are ready.
- **User Story Development**:
  - Backend models (`[P]` tasks) and schemas can be created concurrently.
  - Frontend components (`T028`, `T030`, `T038`, `T049`, `T054`, `T065`, `T074`, `T082`) can be developed in parallel with backend endpoints.
  - Once Phase 2 is complete, US8 (Auth), US1 (Drive), and US2 (Candidate Runner) can be developed concurrently by separate engineers.

---

## Implementation Strategy: MVP First

1. **Sprint 1 (Core MVP)**: Complete **Phase 1 (Setup)** + **Phase 2 (Foundational)** + **Phase 3 (US8 Auth)** + **Phase 4 (US1 Drive Builder)** + **Phase 5 (US2 Candidate Runner)**.
   - *Deliverable*: Recruiters can create drives and candidates can take timed assessments.
2. **Sprint 2 (Integrity & Scale)**: Complete **Phase 6 (US5 Questions & Code)** + **Phase 7 (US4 Proctoring)** + **Phase 8 (US3 Live Dashboard)**.
   - *Deliverable*: Multi-language coding assessments, edge CV proctoring, and live command center.
3. **Sprint 3 (Hiring Intelligence & Automation)**: Complete **Phase 9 (US6 Interviews & 360)** + **Phase 10 (US7 Email & Analytics)** + **Phase 11 (Polish)**.
   - *Deliverable*: Complete enterprise recruitment operating system ready for enterprise pilots.
