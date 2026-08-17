# Implementation Plan: Unified Dashboard RBAC, Excel Whitelist, Geolocation Anti-Cheat & Candidate Attempt Lifecycle

**Feature**: `specs/002-streamlined-recruitment-pipeline/spec.md` (v2.2.0)  
**Status**: Ready for Tasks & Implementation  

---

## 1. Technical Context & Architecture

- **Backend**: FastAPI with asynchronous SQLAlchemy 2.0 (SQLite local / PostgreSQL production).
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide icons, responsive layout for Laptop and Mobile.
- **Actor Roles**: `admin`, `recruiter`, `l1_interviewer`, `l2_interviewer`, `candidate`.
- **Key Modules**:
  - **Excel / CSV Parser**: Handles candidate bulk ingestion, maps columns (`Name`, `Email`, `Phone`, `Experience`), and creates whitelisted candidate records.
  - **Live Geolocation Telemetry**: Captures GPS latitude, longitude, accuracy via browser Geolocation API upon test start and logs it to attempt metadata.
  - **Single-Attempt Lock**: Automatically marks candidate attempt as locked on start. Disallows re-entry unless unlocked by recruiter.
  - **Manual & Bulk Scheduling**: Endpoints to schedule single candidate interview slots or bulk-schedule a batch with automatic calendar invite payloads.
  - **Unified Dashboard UI (`/dashboard`)**: Single consolidated dashboard where tabs adapt dynamically according to the authenticated user's role.

---

## 2. Core Workflows & Endpoints

### 2.1 Authentication & Fast Interviewer Login
- `POST /api/v1/auth/login`: Email + Password login for Admins & Recruiters.
- `POST /api/v1/auth/interviewer-login`: Fast **Name-Based login** for L1 and L2 interviewers returning role-scoped JWT tokens.
- `GET /api/v1/auth/interviewers`: Returns list of registered L1/L2 interviewers for 1-click name selection.

### 2.2 Drive Management & Excel Whitelist Import
- `POST /api/v1/drives`: Create drive with question paper, answer keys, cutoff %, rejection email toggle.
- `POST /api/v1/drives/{id}/import-whitelist`: Upload Excel (`.xlsx`, `.xls`) or CSV file to populate drive's candidate whitelist.
- `GET /api/v1/drives/{id}/share`: Generates public magic link (`/drive/{id}/apply`) + QR Code.

### 2.3 Candidate Onboarding, Auto-Fill, Geolocation & Single-Attempt Lock
- `POST /api/v1/public/drive/{id}/check-whitelist`: Validates candidate email against drive whitelist. If valid, returns **auto-filled profile details** (Name, Phone, Experience). If invalid, rejects entry.
- `POST /api/v1/public/drive/{id}/register`: Registers candidate session, captures **Live Geolocation** (`latitude`, `longitude`, `accuracy`), and creates **Locked Attempt Session**.
- `POST /api/v1/public/assessment/submit`: Evaluates answers against answer keys and sets status (`L1_ELIGIBLE` or `TEST_REJECTED`).
- `POST /api/v1/drives/{id}/candidates/{candidate_id}/reactivate`: **Recruiter exclusive action** to clear attempt lock and allow candidate re-entry.

### 2.4 Manual & Bulk Interview Scheduling
- `POST /api/v1/interviews/schedule/single`: Schedules a specific candidate with an interviewer, date/time slot, and meeting link.
- `POST /api/v1/interviews/schedule/bulk`: Batch-schedules all eligible candidates across available interviewers and slots.

### 2.5 L1 & L2 Review Pools & Dossiers
- `GET /api/v1/interviews/l1/pool`: Lists `L1_ELIGIBLE` candidates.
- `POST /api/v1/interviews/l1/{candidate_id}/claim` & `/release`: Claims/releases candidate.
- `GET /api/v1/interviews/l1/{candidate_id}/dossier`: Displays candidate profile, live geolocation coordinates, and submitted test paper with answer keys.
- `POST /api/v1/interviews/l1/{candidate_id}/evaluate`: Submits verdict (`PASS` $\implies$ `L2_ELIGIBLE`, `REJECT` $\implies$ `L1_REJECTED`).
- `GET /api/v1/interviews/l2/pool` & `/dossier`: Lists `L2_ELIGIBLE` candidates and displays profile + test paper + **L1 notes & ratings**.
- `POST /api/v1/interviews/l2/{candidate_id}/evaluate`: Submits final hiring verdict (`PASS` $\implies$ `SELECTED`, `REJECT` $\implies$ `L2_REJECTED`).

### 2.6 Unified Dashboard UI (`/dashboard`)
- Consolidated tabbed interface:
  - **Recruiter Tab**: Drive Manager, Excel Whitelist Importer, Scheduling Modal, Pipeline 360 & Candidate Attempt Reactivation.
  - **L1 Pool Tab**: L1 Candidates Pool with Claim/Release & Dossier modal.
  - **L2 Pool Tab**: L2 Candidates Pool with Claim/Release & Dossier modal.
  - **Admin Tab**: System Health Status, Role Allocations, Platform Security Overview.
