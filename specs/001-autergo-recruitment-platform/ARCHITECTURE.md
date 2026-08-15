# Autergo Enterprise Recruitment Platform — System Architecture & Technical Design Document

**Version**: 1.0.0  
**Architect**: DeepMind Antigravity Engineering  
**Status**: Implemented & Operational  

---

## 1. System Context & Top-Level Architecture

The platform is designed following a **Clean Modular Monolith** architecture with clear service boundaries, asynchronous event loops, real-time WebSockets, and a multi-tier LLM failover strategy.

```mermaid
graph TD
    subgraph Client Layer
        WebRecruiter["Next.js Recruiter Portal (App Router)"]
        WebCandidate["Next.js Candidate Assessment Runner"]
        CVEdge["Client-Side MediaPipe Edge CV Engine"]
    end

    subgraph API & Gateway Layer
        FastAPIGateway["FastAPI Async Gateway (:8000)"]
        WSManager["WebSocket Connection Hub & Telemetry Ingestion"]
        AuthGuard["JWT & RBAC Dependency Injection Guards"]
    end

    subgraph Core Domain Services
        DriveService["Recruitment Drive & Stage Manager"]
        SessionService["Candidate Session & Disconnect Recovery Engine"]
        SandboxService["Multi-Language Sandboxed Code Runner"]
        RiskEngine["Multi-Signal Weighted Proctoring Risk Engine"]
        InterviewService["Interview Scheduling & Candidate 360 Aggregator"]
        CommService["Communication & Event Dispatch Engine"]
    end

    subgraph AI Intelligence Layer
        GuardrailInterceptor["Prompt Sanitizer & Injection Interceptor"]
        NVIDIAOrchestrator["Primary LLM: NVIDIA Nemotron 3.5 Lightning"]
        GroqOrchestrator["Fallback LLM: Groq Llama-3.3-70B / Gemma-2-9B"]
    end

    subgraph Persistence & Infrastructure
        DB[(PostgreSQL 16 with pgvector / SQLite Local)]
        Cache[(Redis 7 Pub/Sub & Session Cache)]
        ObjectStore[(MinIO / AWS S3 Evidence Store)]
    end

    WebRecruiter --> FastAPIGateway
    WebCandidate --> FastAPIGateway
    WebCandidate --> CVEdge
    CVEdge -.->|Telemetry SSE/WS| FastAPIGateway

    FastAPIGateway --> AuthGuard
    FastAPIGateway --> WSManager
    FastAPIGateway --> DriveService
    FastAPIGateway --> SessionService
    FastAPIGateway --> SandboxService
    FastAPIGateway --> RiskEngine
    FastAPIGateway --> InterviewService
    FastAPIGateway --> CommService

    DriveService --> DB
    SessionService --> DB
    SessionService --> Cache
    SandboxService --> DB
    RiskEngine --> DB
    RiskEngine --> ObjectStore
    WSManager --> Cache

    InterviewService --> GuardrailInterceptor
    GuardrailInterceptor --> NVIDIAOrchestrator
    NVIDIAOrchestrator -.->|Auto-Failover on 5xx/Timeout| GroqOrchestrator
```

---

## 2. Component Design & Layer Responsibilities

### 2.1 Backend Layering (`/backend/app`)
- **`api/v1/`**: Endpoint routing, HTTP parameter parsing, Pydantic request/response serialization, status codes.
- **`core/`**: Database engine creation, Redis pool, JWT token generation/validation, password hashing, and central configuration.
- **`models/`**: SQLAlchemy 2.0 ORM declarations with universal JSON serialization, relationships, and foreign key cascades.
- **`schemas/`**: Strict Pydantic v2 schemas for data contracts.
- **`services/`**:
  - `llm_service.py`: Multi-provider LLM orchestration with streaming generators and input sanitization.
  - `sandbox_service.py`: Subprocess isolation for Python, Node.js, C++, Java, and SQL execution with timeout kills.
  - `risk_engine.py`: Weighted anomaly scoring formula:
    $$\text{RiskScore} = \min\left(100, \sum w_i \times \text{Count}_i \times \text{Confidence}_i\right)$$
  - `audit_service.py`: Immutable change recording for all administrative actions.

### 2.2 Frontend Layering (`/frontend/src`)
- **`app/(auth)/`**: Login and recruiter authentication flows.
- **`app/(recruiter)/`**:
  - `dashboard/`: Overview of active drives and applicant velocity.
  - `drives/create/`: 8-step creation wizard.
  - `drives/[id]/`: Pipeline Kanban and candidate management.
  - `drives/[id]/live/`: Live WebSocket command center.
  - `drives/[id]/candidate360/`: Unified candidate evaluation profile.
  - `questions/`: Question bank and streaming AI question generator.
  - `interviews/`: Interview scheduling and structured rubric evaluations.
- **`app/(candidate)/`**:
  - `test/[token]/verify/`: Magic link validation + OTP input.
  - `test/[token]/readiness/`: Camera, microphone, and browser compatibility verification.
  - `test/[token]/take/`: Timed question runner, Monaco code editor, test case assertion panel, and auto-save.

---

## 3. Database Schema & Entity Relationship Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : "employs"
    ORGANIZATION ||--o{ RECRUITMENT_DRIVE : "creates"
    ORGANIZATION ||--o{ QUESTION : "manages"
    ORGANIZATION ||--o{ AUDIT_LOG : "records"

    RECRUITMENT_DRIVE ||--o{ DRIVE_STAGE : "contains"
    RECRUITMENT_DRIVE ||--o{ ASSESSMENT : "defines"
    RECRUITMENT_DRIVE ||--o{ APPLICATION : "receives"
    RECRUITMENT_DRIVE ||--o{ CANDIDATE_FORM_FIELD : "specifies"

    CANDIDATE ||--o{ APPLICATION : "submits"
    APPLICATION ||--o{ ASSESSMENT_ATTEMPT : "takes"
    APPLICATION ||--o{ INTERVIEW : "sits_for"
    APPLICATION ||--|| CANDIDATE_SCORECARD : "evaluated_by"

    ASSESSMENT_ATTEMPT ||--o{ ATTEMPT_ANSWER : "answers"
    ASSESSMENT_ATTEMPT ||--|| PROCTOR_SESSION : "monitored_by"
    PROCTOR_SESSION ||--o{ PROCTOR_EVENT : "logs"

    INTERVIEW ||--o{ INTERVIEW_EVALUATION : "produces"
```

---

## 4. Multi-Tier AI Architecture & Guardrails

1. **Routing Strategy**:
   - Every AI request is dispatched first to **NVIDIA Cloud API** (`nvidia/nemotron-3.5-lightning-30b-a3b`).
   - If NVIDIA returns an HTTP error or exceeds latency SLAs, the request is rerouted in real time to **Groq API** (`llama-3.3-70b-versatile` or `gemma2-9b-it`).
2. **Safety & Injection Defense**:
   - System prompts enforce strict JSON output formatting.
   - User inputs are scanned for prompt injection attacks (`ignore previous instructions`, `system override`, `jailbreak`) before hitting the LLM.
3. **Human-in-the-Loop (HITL)**:
   - AI generates scoring recommendations, summaries, and questions.
   - Disqualification, score overrides, and final hiring statuses require recruiter approval.
