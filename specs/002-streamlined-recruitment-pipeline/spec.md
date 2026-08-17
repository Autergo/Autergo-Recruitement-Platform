# Feature Specification: Unified Dashboard RBAC Portal with Excel Whitelist, Geo-Location Anti-Cheat, Single-Attempt Lock & Bulk/Manual Interview Scheduling

**Feature Directory**: `specs/002-streamlined-recruitment-pipeline/`  
**Status**: Approved & Specified  
**Version**: 2.2.0  
**Domain**: Enterprise Recruitment & RBAC Workspace  

---

## 1. Overview & Unified Dashboard Architecture

All internal users (**Admin, Recruiter, L1 Interviewer, L2 Interviewer**) access the system through a **single, unified dashboard portal (`/dashboard`)** with strict Role-Based Access Control (RBAC), fast name-based interviewer authentication, and manual/bulk scheduling capabilities:

- **Admin View**: User & role management, platform overview, system health check monitor, tenant data security. (Login: Email + Password).
- **Recruiter View**: Create, manage, and delete recruitment drives; **import candidate whitelist from Excel / CSV files**; auto-fill candidate info on whitelisted email entry; **manual and bulk interview scheduling**; generate shareable Magic Link & QR Code; candidate 360 pipeline tracking; **exclusive authority to reactivate/unlock candidate test attempts**. (Login: Email + Password).
- **L1 Technical Interviewer View**: **Direct Name-based Login**; view unassigned `L1_ELIGIBLE` candidate pool; voluntary claim/release; inspect candidate profile, live geolocation map coordinates, and submitted test paper with answer keys; submit Pass/Reject evaluation.
- **L2 Panel Interviewer View**: **Direct Name-based Login**; view `L2_ELIGIBLE` candidate pool; voluntary claim/release; inspect candidate profile + test paper + **L1 interviewer ratings & feedback comments**; submit final hiring verdict.
- **Candidate Assessment Flow**: Zero-account entry via **Drive Magic Link / QR Code**; email verified against drive's imported Excel whitelist; name/phone/experience **auto-filled from Excel**; **live geolocation captured** before test start; **single-attempt lock** enforced immediately upon entry (re-entry strictly blocked unless reactivated by recruiter).

---

## 2. Actor Roles & Permissions Matrix

| Capability | Admin | Recruiter | L1 Interviewer | L2 Interviewer | Candidate |
|---|:---:|:---:|:---:|:---:|:---:|
| **Authentication Type** | Email + Password | Email + Password | Name Selection / Simple Login | Name Selection / Simple Login | Magic Link + Whitelisted Email |
| **Unified Portal Dashboard Access (`/dashboard`)** | ✅ Admin View | ✅ Recruiter View | ✅ L1 Pool View | ✅ L2 Pool View | ❌ (Candidate Test Portal) |
| **System Health Check & User Role Allocations** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Create, Edit & Delete Drives** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Import Candidate Whitelist via Excel/CSV** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Manual & Bulk Candidate Interview Scheduling** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Generate & Distribute Magic Link + QR Code** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Auto-Fill Candidate Info from Whitelist** | System | System | ❌ | ❌ | ✅ Fast Confirmation |
| **Whitelist Email Verification on Magic Link** | System | System | ❌ | ❌ | ✅ Strict Enforced |
| **Live Geolocation Telemetry (Lat/Long/City)** | System | System | ❌ | ❌ | ✅ Captured at Start |
| **Single-Attempt Lock on Test Start** | System | System | ❌ | ❌ | ✅ Strict Enforced |
| **Reactivate / Unlock Candidate Attempt** | ✅ Full | ✅ Full (Exclusive) | ❌ | ❌ | ❌ |
| **Claim / Release Candidate in L1 Pool** | ✅ Full | ✅ Full | ✅ Claim / Release | ❌ | ❌ |
| **View L1 Dossier (Paper + Geo + Profile)** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **Submit L1 Technical Verdict (Pass $\rightarrow$ L2)** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **Claim / Release Candidate in L2 Pool** | ✅ Full | ✅ Full | ❌ | ✅ Claim / Release | ❌ |
| **View L2 Dossier (L1 Notes + Rating + Paper)** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **Submit L2 Panel Decision (Pass / Reject)** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **Candidate 360 Pipeline & Rejection Reasons** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |

---

## 3. User Scenarios & Acceptance Flows

### Scenario 1: Unified Dashboard & Role-Adaptive Navigation
- **Given** an internal user visiting `http://localhost:3000/login`:
- **When** logging in:
  - **Admins & Recruiters**: Log in using Email & Password.
  - **L1 & L2 Interviewers**: Switch tab to **"Interviewer Quick Access"**, select or enter their Name, and log in directly without a password.
- **Then** the user is directed to the **Unified Dashboard (`/dashboard`)**, where the UI automatically renders their permitted views and tabs:
  - Recruiters see Drive Management, Excel Import, Scheduling, and Pipeline 360.
  - L1 Interviewers see the L1 Candidate Pool.
  - L2 Interviewers see the L2 Candidate Pool.
  - Admins see System Health, Role Management, and all drives.

### Scenario 2: Recruiter Imports Candidates from Excel, Schedules & Distributes Link
- **Given** a logged-in Recruiter on the unified dashboard:
- **When** the recruiter creates a drive:
  - Configures job title, assessment questions with answer keys, and cutoff percentage.
  - Uploads an Excel file (`.xlsx`, `.csv`) containing candidate records (`Name`, `Email`, `Phone`, `Experience`).
  - Sets **Interview Scheduling** (Manual single candidate slot or Bulk slot scheduling for the batch).
- **Then** the system:
  - Whitelists all candidate emails and pre-stores their profile records.
  - Generates the shareable **Drive Magic Link** (`/drive/{id}/apply`) and **QR Code**.

### Scenario 3: Candidate Verification, Auto-Fill, Geolocation & Single-Attempt Lock
- **Given** a candidate opening the Drive Magic Link:
- **When** the candidate enters their email:
  - **Step 1: Whitelist Check**: If email is not in the imported Excel whitelist, candidate is rejected: *"Your email is not authorized for this drive."*
  - **Step 2: Auto-Fill**: Name, Phone, and Experience are instantly auto-filled from the uploaded Excel sheet so candidate can confirm in 1 click.
  - **Step 3: Single-Attempt Check**: If candidate has already entered the test previously, access is blocked: *"Assessment session already used. Contact recruiter to reactivate your attempt."*
  - **Step 4: Live Geolocation Capture**: Browser prompts for HTML5 Geolocation permission; latitude, longitude, and timestamp are captured and logged.
  - **Step 5: Proctoring Consent & Test Entry**: Candidate enters the test. The attempt is immediately locked (`status: in_progress`).
- **Then** any attempt to reopen the test link from another browser/tab is locked out.

### Scenario 4: Recruiter Unlocks a Candidate Attempt
- **Given** a candidate who faced network disconnection or browser crash:
- **When** the recruiter opens the Candidate 360 Drawer in `/dashboard`:
  - Sees candidate attempt marked as `TEST_LOCKED` or `IN_PROGRESS`.
  - Clicks **"Reactivate Candidate Attempt"**.
- **Then** the lock is cleared, enabling the candidate to resume or retake the test.

---

## 4. Functional Requirements

### 4.1 Unified Dashboard & Authentication
- **`FR-001`**: `/dashboard` shall serve as the unified workspace for all internal actors, dynamically rendering role-appropriate tabs and controls.
- **`FR-002`**: Email + Password authentication for `admin` and `recruiter`.
- **`FR-003`**: Instant Name-Based authentication for `l1_interviewer` and `l2_interviewer`.
- **`FR-004`**: Admin tab shall provide system health monitoring, active session counts, and role configuration.

### 4.2 Excel Import, Auto-Fill & Scheduling
- **`FR-005`**: Recruiter drive creation and drive details page must support Excel (`.xlsx`, `.xls`) and CSV candidate bulk upload.
- **`FR-006`**: Candidate registration endpoint must enforce whitelist matching and auto-fill profile details from the uploaded Excel record.
- **`FR-007`**: Recruiter can perform **Manual Single Scheduling** and **Bulk Batch Scheduling** for candidate interview slots.

### 4.3 Anti-Cheat & Attempt Lifecycle
- **`FR-008`**: System shall capture HTML5 live geolocation (latitude, longitude, accuracy) upon test entry.
- **`FR-009`**: Test attempts must enforce strict Single-Attempt Locking. Re-entry by the candidate is blocked.
- **`FR-010`**: Recruiters and Admins shall have a dedicated **"Reactivate Attempt"** action to unlock candidate sessions.
- **`FR-011`**: Dual-device proctoring (Laptop & Mobile Web) shall monitor fullscreen blur and tab/app switches.

### 4.4 L1 & L2 Review Pools
- **`FR-012`**: L1 pool allows claiming candidates, viewing submitted test paper with answer keys and live location, and submitting Pass/Reject.
- **`FR-013`**: L2 pool allows claiming candidates, viewing candidate profile + test paper + **L1 interviewer ratings & feedback**, and submitting final hiring verdict.

---

## 5. Success Criteria & Quality Metrics

1. **SC-001**: 100% of internal user navigation (Admin, Recruiter, L1, L2) happens within the unified `/dashboard` workspace.
2. **SC-002**: 100% of non-whitelisted emails attempting candidate registration are blocked.
3. **SC-003**: Whitelisted candidate info is auto-filled in $<100$ms upon email entry.
4. **SC-004**: 100% of candidate re-entry attempts are locked until reactivated by the recruiter.
5. **SC-005**: Recruiters can perform manual and bulk interview slot scheduling directly from `/dashboard`.
