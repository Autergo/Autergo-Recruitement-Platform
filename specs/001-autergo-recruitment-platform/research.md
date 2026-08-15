# Research & Architectural Decisions: Autergo Enterprise Recruitment Platform

**Feature**: `001-autergo-recruitment-platform`  
**Date**: 2026-08-14  
**Status**: Completed  

---

## 1. Core Architecture & Modular Monolith Pattern

### Decision
Implement Autergo as a **Modular Monolith** using **FastAPI (Python 3.11+)** on the backend and **Next.js 14+ (App Router, TypeScript, Tailwind CSS)** on the frontend. Internal module boundaries are strictly enforced with dedicated service domains: `auth`, `organizations`, `drives`, `candidates`, `assessments`, `questions`, `proctoring`, `interviews`, `evaluations`, `communications`, and `analytics`.

### Rationale
- High development velocity without distributed transaction/network overhead during MVP.
- Clean module boundaries allow selective extraction of high-load domains (e.g., Proctoring Ingestion or Realtime Gateway) into standalone microservices later if scaling limits are reached.
- Direct relational integrity checks and ACID transactions in PostgreSQL for critical recruitment drive workflows.

### Alternatives Considered
- **Microservices from Day 1**: Rejected due to premature operational complexity, distributed state synchronization overhead, and higher latency for multi-stage drive queries.
- **Pure Server-Side Rendered Django**: Rejected because the live candidate test runner, proctoring CV streams, and live recruiter command center require rich client-side interactivity, WebSockets, and dynamic state management.

---

## 2. Primary Data Storage & Vector Capabilities

### Decision
- **PostgreSQL 16** as the core relational and transactional database.
- **pgvector extension** enabled for storing and querying embeddings (resume parsing, question semantic deduplication, candidate skill matching).
- **Redis 7** for caching, ephemeral candidate assessment session state, rate limiting, distributed locking, and live telemetry pub/sub buffering.
- **S3-Compatible Object Storage (MinIO / AWS S3 / Azure Blob)** with client-side signed upload/download URLs for resumes and event-driven proctoring evidence clips.

### Rationale
- Autergo's domain graph (Organization → Users → Drives → Candidates → Applications → Assessments → Attempts → Answers → Interviews → Scorecards) is heavily relational and requires foreign key integrity and transactional isolation.
- `pgvector` eliminates the operational overhead of managing a separate vector database (e.g., Pinecone or Qdrant) in V1.
- Redis provides sub-millisecond candidate session state checks and rate limiting to protect API endpoints against heavy submission traffic.

### Alternatives Considered
- **MongoDB as primary datastore**: Rejected because multi-entity relational integrity, tenant scoping, and audit logs are much more robustly enforced with PostgreSQL relational constraints and transactions.
- **Separate Dedicated Vector DB**: Rejected for V1 simplicity; `pgvector` within PostgreSQL handles up to millions of embeddings with low operational footprint.

---

## 3. Sandboxed Multi-Language Code Execution

### Decision
Implement an asynchronous, isolated code execution worker system using **Docker / Containerd / nsjail sandbox workers** supporting Python, JavaScript/TypeScript (Node.js), Java (OpenJDK), C++ (GCC), and SQL (ephemeral in-memory SQLite / PostgreSQL test sandbox). Code evaluation runs against public and hidden unit test cases with strict CPU (e.g., 2.0s), memory (e.g., 256MB), process count, and zero-network security jail constraints.

### Rationale
- Secure isolation prevents malicious code injection, container escape, host filesystem tampering, or denial of service.
- Multi-language test runner validates candidate solutions against parameterized inputs and expected outputs deterministically.

### Alternatives Considered
- **Direct in-process subprocess execution (`exec` / `subprocess.run`)**: Strongly rejected due to severe security vulnerabilities and process fork-bomb risks.
- **Third-Party API (Judge0 / HackerRank API)**: Kept as optional pluggable fallback adapter, but local sandboxed runner is prioritized for zero-trust data privacy and self-contained deployment.

---

## 4. Client-Side Computer Vision & Event-Driven Proctoring

### Decision
- **Client-Side Inference**: Use **MediaPipe / TensorFlow.js / ONNX Runtime Web** directly in the candidate's browser for real-time face detection, head pose estimation, and camera presence.
- **Telemetry Event Pipeline**: Lightweight JSON telemetry events (e.g., `FACE_ABSENT`, `MULTIPLE_FACES`, `TAB_SWITCHED`) are streamed via WebSockets / HTTP batches to the backend.
- **Event-Driven Evidence Media**: The client captures short timestamped snapshots (JPEG) or 3-second clips (WebM) only upon high-severity anomalies (multiple faces, phone detected, second voice), securely uploading them to object storage with signed URLs.
- **Backend Risk Engine**: Aggregates time-series events into a composite weighted suspicion score (0–100) mapped to risk bands (`NORMAL`, `WATCH`, `SUSPICIOUS`, `CRITICAL`).

### Rationale
- Running full video inference on backend servers for 5,000 concurrent candidates would require extreme GPU infrastructure and massive network bandwidth. Client-side edge inference reduces backend load by >90%.
- Capturing media only on anomaly triggers respects privacy regulations, limits storage costs, and delivers actionable evidence clips directly to recruiters.

### Alternatives Considered
- **Continuous Raw Video Streaming to Backend**: Rejected due to immense bandwidth, storage costs, and privacy compliance concerns.
- **Single-Signal Auto-Banning**: Strongly rejected per core constitutional principle (multi-signal correlation + human adjudication).

---

## 5. High-Throughput Submission & Hybrid Scoring Pipeline

### Decision
Implement a **Hybrid Scoring Engine**:
1. **Synchronous Fast Path**: When a candidate submits, validate token, mark attempt state as `SUBMITTED`, execute deterministic scoring for objective questions (MCQs, True/False, and pre-evaluated coding test assertions), compute raw objective score, and return immediate 200 HTTP response.
2. **Asynchronous Background Path**: Enqueue Celery / Redis tasks for asynchronous operations: executing long-running code sandbox tests (if pending), AI subjective evaluation with LLM rubrics, proctoring timeline consolidation, Candidate 360 skill matrix calculation, and recruiter webhook/notification dispatch.

### Rationale
- Ensures that peak traffic (e.g., 5,000 simultaneous submissions at the close of an assessment window) is processed without gateway timeouts, DB connection exhaustion, or dropped requests.
- Recruiter dashboard receives updated scores dynamically as background worker tasks complete.

### Alternatives Considered
- **Synchronous AI Evaluation during Submission**: Rejected because LLM calls take 1–5 seconds per question and would cause gateway 504 timeouts under peak concurrent load.
- **Full Async Batch Everything**: Rejected because candidate needs instant submission acknowledgment and basic objective score validation.

---

## 6. Real-Time Dashboard Architecture & Fallback

### Decision
- Primary real-time communication via **WebSockets (`/api/v1/ws/drives/{drive_id}/live`)** backed by Redis Pub/Sub.
- Recruiter Command Center subscribes to drive-specific event channels to receive live candidate count metrics, progress bars, technical alerts, and critical proctoring flags.
- Candidate client and recruiter UI implement an automated exponential-backoff fallback to **HTTP Long-Polling (`/api/v1/drives/{drive_id}/live/poll`)** if WebSockets are blocked by corporate proxies or network degradation.

### Rationale
- Provides sub-second operational monitoring for live recruitment drives while guaranteeing accessibility across enterprise firewalls and restrictive corporate networks.

---

## 7. AI Transparency, Prompt Versioning & Grounded Intelligence

### Decision
- All AI workflows (Question Generation, Resume Parsing, AI Interview Questions, Candidate Summarization) utilize a structured JSON-schema-validated LLM pipeline (via OpenAI / Anthropic / Local LLM provider adapters).
- Every AI output stores: `model_name`, `model_version`, `prompt_template_version`, `confidence_score`, and explicit citation references to candidate source telemetry or resume text.
- Human recruiter overrides and interview scores are saved in separate fields, preserving both AI recommendation and human decision for complete auditability.

### Rationale
- Strict compliance with Constitution Principle II (AI Transparency & Evidence-Based Intelligence).
- Fully reproducible evaluations across audit cycles and anti-bias verification.
