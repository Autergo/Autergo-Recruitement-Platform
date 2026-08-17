# Implementation Plan: Streamlined 4-Actor Recruitment Platform

**Feature**: `specs/002-streamlined-recruitment-pipeline/spec.md`  
**Status**: Ready for Tasks (`/speckit-tasks`)  

---

## 1. Technical Context & Architecture

- **Backend**: FastAPI with asynchronous SQLAlchemy 2.0 (SQLite local / PostgreSQL production).
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide icons, responsive layout for Laptop and Mobile.
- **Actor Roles**: `admin`, `recruiter`, `l1_interviewer`, `l2_interviewer`, `candidate`.
- **Proctoring**:
  - Laptop: HTML5 Fullscreen API, `blur`, `focusout`, and `visibilitychange` listeners.
  - Mobile Web: `visibilitychange` and Page Visibility API for detecting app switches and minimization.

---

## 2. Core Workflows & Endpoints

### 2.1 Recruitment Drive & Sharing
- `POST /api/v1/drives`: Create drive with onboarding fields, question paper, cutoff %, rejection email toggle.
- `GET /api/v1/drives/{id}/share`: Generates public magic link (`/drive/{id}/apply`) + QR Code SVG.
- `GET /api/v1/public/drive/{id}`: Public drive details for candidate registration.

### 2.2 Candidate Onboarding & Test Execution
- `POST /api/v1/public/drive/{id}/register`: Candidate enters email, fills profile info (Name, Phone, Experience, Referral). Returns session token.
- `POST /api/v1/public/proctoring/events`: Logs tab-switch / fullscreen-exit events.
- `POST /api/v1/public/assessment/submit`: Grades submission. Sets status:
  - $\ge \text{Cutoff} \implies$ `L1_ELIGIBLE`
  - $< \text{Cutoff} \implies$ `TEST_REJECTED`

### 2.3 L1 Interviewer Pool & Evaluation
- `GET /api/v1/interviews/l1/pool`: Lists `L1_ELIGIBLE` and claimed candidates.
- `POST /api/v1/interviews/l1/{candidate_id}/claim`: Locks candidate to L1 interviewer (`L1_IN_PROGRESS`).
- `POST /api/v1/interviews/l1/{candidate_id}/release`: Unclaims candidate back to `L1_ELIGIBLE`.
- `GET /api/v1/interviews/l1/{candidate_id}/dossier`: Full candidate profile + submitted test paper with answer keys.
- `POST /api/v1/interviews/l1/{candidate_id}/evaluate`: Submits verdict (`PASS` $\implies$ `L2_ELIGIBLE`, `REJECT` $\implies$ `L1_REJECTED`), rating, and notes.

### 2.4 L2 Interviewer Pool & Evaluation
- `GET /api/v1/interviews/l2/pool`: Lists `L2_ELIGIBLE` candidates.
- `POST /api/v1/interviews/l2/{candidate_id}/claim`: Locks candidate to L2 interviewer (`L2_IN_PROGRESS`).
- `POST /api/v1/interviews/l2/{candidate_id}/release`: Unclaims candidate back to `L2_ELIGIBLE`.
- `GET /api/v1/interviews/l2/{candidate_id}/dossier`: Candidate profile + test paper + **L1 notes & ratings**.
- `POST /api/v1/interviews/l2/{candidate_id}/evaluate`: Submits verdict (`PASS` $\implies$ `L2_CLEARED`, `REJECT` $\implies$ `L2_REJECTED`), rating, and notes.

### 2.5 Recruiter 360 Tracking
- `GET /api/v1/drives/{id}/candidates`: Full candidate table with stage filters (`ALL`, `TEST_PENDING`, `L1_POOL`, `L2_POOL`, `SELECTED`, `REJECTED`).
- `GET /api/v1/drives/{id}/candidates/{candidate_id}/360`: Full chronological audit (test score, proctoring flags, L1 reviewer notes, L2 reviewer notes, rejection reasons).
