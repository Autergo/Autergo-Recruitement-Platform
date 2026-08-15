<!--
Sync Impact Report:
- Version change: v1.0.0 -> v1.1.0
- List of modified principles:
  - Updated Principle II: AI Transparency, Multi-Tier LLM Architecture, Guardrails & Human-in-the-Loop
  - Added Principle VI: Continuous Traceability, Minute Change Logging & Deployment Ledger (NON-NEGOTIABLE)
- Added sections:
  - Multi-Tier LLM Orchestration & Streaming Architecture (NVIDIA Nemotron Primary, Groq Secondary / Fallbacks)
  - Change & Deployment Tracking Policy (CHANGELOG_TRACKER.md / Deployment Ledger)
- Deferred items: None
-->
# Autergo AI Recruitment Platform Constitution

## Core Principles

### I. Enterprise Security & Zero Trust Architecture (NON-NEGOTIABLE)
Security and data protection are strict prerequisites for every feature.
- All candidate PII, assessment data, audio/video feeds, and evaluation scores MUST be encrypted at rest (AES-256) and in transit (TLS 1.3).
- Strict role-based access control (RBAC), multi-tenant isolation, and principle of least privilege MUST be enforced at both the API and database levels.
- Every state mutation and administrative action MUST produce an immutable, tamper-evident audit log trace.

### II. AI Transparency, Multi-Tier LLM Architecture, Guardrails & Human-in-the-Loop
AI functionality serves to assist human recruiters and MUST be auditable, unbiased, transparent, safe, and cost-effective.
- **Multi-Tier Free / High-Performance LLM Routing**:
  - **Primary Model**: NVIDIA Cloud API (`nvidia/nemotron-3.5-lightning-30b-a3b` or free high-throughput reasoning models).
  - **Secondary / Fallback Engine**: Groq API (free high-speed inference models like `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma2-9b-it`).
  - Strict adherence to free/cost-optimized models; zero unexpected billing on commercial endpoints without explicit recruiter configuration.
- **Streaming & Ultra-Low Latency**: All conversational, question evaluation, and generative AI features MUST support token streaming (Server-Sent Events / WebSocket chunk streaming) for real-time responsiveness.
- **Safety Guardrails & Task Boundary Enforcement**: Strict prompt guards and regex/semantic output validators must prevent hallucination, prompt injection, and execution of out-of-scope or destructive actions.
- **Human-in-the-Loop (HITL) Requirement**: AI must NEVER autonomously disqualify, reject, or extend offers. AI provides evidence-backed recommendations, while human recruiters/interviewers hold the final decision authority.

### III. High Scalability & Durable Operations
The architecture must withstand high-volume recruitment drives and peak candidate loads without data loss or service interruption.
- Core assessment services, proctoring telemetry ingestion, and scoring engines MUST scale horizontally and degrade gracefully under peak concurrent candidate traffic.
- Background tasks (email automation, video processing, AI evaluation, proctoring score calculation) MUST operate via idempotent, resilient message queues with automatic retry and dead-letter queueing.
- System operations MUST guarantee zero data loss during network interruptions or unexpected server restarts.

### IV. Frictionless Candidate Experience & Multi-Signal Integrity
Candidate access must be frictionless while enforcing high-fidelity, fair proctoring.
- Candidate assessment access MUST be zero-friction (magic token/link authentication without mandatory account creation).
- Proctoring must strictly utilize multi-signal correlation (camera, tab focus, audio, network telemetry) to generate a suspicion score and evidence log—NEVER relying on a single isolated heuristic to flag cheating.
- Candidate-facing web interfaces MUST be dynamic, fluid, responsive, and accessible across desktop and mobile browsers.

### V. Automated Comprehensive Testing & Continuous Quality Gates
Software quality is verified empirically through strict, automated testing pipelines.
- All core business logic, evaluation algorithms, security permissions, and API contracts MUST maintain comprehensive unit, integration, and end-to-end test coverage.
- Code changes MUST NOT be merged to main without passing all automated build, linting, security scanning, and test suite execution checks.

### VI. Continuous Traceability, Minute Change Logging & Deployment Ledger (NON-NEGOTIABLE)
Every minute engineering modification, architectural adjustment, deployment, and test execution MUST be documented in real-time.
- The repository MUST maintain a master tracking ledger (`CHANGELOG_TRACKER.md` / deployment tracking record).
- Every agent invocation, commit, hotfix, API rollout, or environment change MUST append a timestamped entry with exact files modified, test verification results, and operational impacts.

## Enterprise Compliance & Governance Requirements

### Security & Data Privacy
- **Compliance Alignment**: System architecture must align with SOC2 Type II, GDPR, and ISO 27001 data protection standards.
- **Data Retention & Anonymization**: Candidate data retention policies must allow configurable auto-deletion and anonymization upon recruiter drive archiving or candidate request.

### Multi-Tier LLM Orchestration & Safety Guardrails
- **Primary & Fallback Protocol**:
  1. Attempt inference with NVIDIA API (`nvidia/nemotron-3.5-lightning-30b-a3b` with reasoning tokens).
  2. In case of rate limits, timeouts, or network anomalies, auto-failover to Groq API.
  3. All generation must pass through input sanitization and output schema validation.
- **Low Latency & Streaming**: Real-time evaluation results and question generation must stream chunks directly to the client.

## System Architecture & Operational Guidelines

### Technical Stack & Quality Standards
- **Modular Micro-Monolith**: Clear boundaries between Candidate Frontends, Recruiter Dashboard, Assessment Engine, Proctoring Service, and AI Processing Pipeline.
- **API First & Schema Enforcement**: All internal and external communications must follow strongly-typed API schemas (FastAPI Pydantic & OpenAPI).

## Governance
- **Authority**: This Constitution supersedes all informal team agreements, individual coding preferences, and legacy documentation.
- **Amendment Policy**: Amendments require formal proposal, review of architecture impact, and explicit consensus.
- **Compliance Verification**: All changes, PRs, and execution runs MUST update the `CHANGELOG_TRACKER.md` and satisfy all constitutional principles.

**Version**: 1.1.0 | **Ratified**: 2026-08-14 | **Last Amended**: 2026-08-15
