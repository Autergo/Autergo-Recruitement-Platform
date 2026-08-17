# Feature Specification: 4-Role Enterprise Recruitment Pipeline with Excel Import, Live Geo-Location, Single-Attempt Lock & Name-Based Interviewer Login

**Feature Directory**: `specs/002-streamlined-recruitment-pipeline/`  
**Status**: Revised Draft  
**Version**: 2.0.0  
**Domain**: Enterprise Recruitment, Anti-Cheat Proctoring & Interview Lifecycle Management  

---

## 1. Overview & Problem Statement

The platform enforces a secure, robust recruitment operating model centered around **4 distinct RBAC roles**, strict candidate whitelist verification, single-entry test locking with recruiter reset authority, live candidate geolocation tracking, and low-friction name-based interviewer authentication:

1. **Admin**: System-wide control, tenant governance, user role allocations, system health checks, and data security monitoring.
2. **Recruiter**: Drive lifecycle management (create, delete, track), Excel/CSV candidate whitelist bulk import, assessment paper builder with answer keys & cutoff, drive Magic Link / QR Code distribution, candidate 360 tracking, and exclusive authority to **re-enable/reactivate locked candidate test attempts**.
3. **L1 Technical Interviewer**: Fast name-based login (no password needed), view unassigned `L1_ELIGIBLE` candidate pool, voluntary claim/release, inspect full candidate profile & submitted test paper with answer keys, and submit technical evaluation (Pass $\rightarrow$ L2, Reject $\rightarrow$ L1_REJECTED).
4. **L2 Advanced/Panel Interviewer**: Fast name-based login, view `L2_ELIGIBLE` candidate pool, voluntary claim/release, inspect candidate profile + test paper + **L1 interviewer ratings & feedback comments**, and submit final hiring verdict.

---

## 2. Actor Roles & Permissions Matrix

| Capability | Admin | Recruiter | L1 Interviewer | L2 Interviewer | Candidate |
|---|:---:|:---:|:---:|:---:|:---:|
| **System Health & User Role Management** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Login Method** | Email + Password | Email + Password | Name Selection / Simple Name Login | Name Selection / Simple Name Login | Magic Link + Whitelisted Email |
| **Create, Edit, Delete Drives** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Import Whitelist Candidates from Excel / CSV** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Distribute Drive Magic Link & QR Code** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Verify Whitelist Email Before Test Entry** | System | System | ❌ | ❌ | ✅ Enforced |
| **Capture Live Geolocation (Lat/Long/City)** | System | System | ❌ | ❌ | ✅ Enforced at Start |
| **Single-Attempt Lock (Prevent Re-entry)** | System | System | ❌ | ❌ | ✅ Enforced |
| **Reactivate / Re-enable Locked Test Attempt** | ✅ Full | ✅ Full (Exclusive) | ❌ | ❌ | ❌ |
| **View L1 Eligible Candidates Pool** | ✅ Full | ✅ Full | ✅ Unclaimed / Claimed | ❌ | ❌ |
| **Claim L1 Candidate & View Test Paper** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **Submit L1 Evaluation (Pass / Reject)** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **View L2 Eligible Candidates (L1 Cleared)** | ✅ Full | ✅ Full | ❌ | ✅ Unclaimed / Claimed | ❌ |
| **View L2 Dossier (L1 Notes + Rating + Paper)** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **Submit L2 Final Evaluation (Pass / Reject)** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **End-to-End Candidate 360 Tracking** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |

---

## 3. User Scenarios & Acceptance Flows

### Scenario 1: Recruiter Creates Drive & Imports Candidates from Excel
- **Given** a logged-in Recruiter:
- **When** the recruiter creates a new drive:
  - Configures job title, description, assessment questions, correct answer keys, and cutoff percentage.
  - Uploads an **Excel (.xlsx, .xls) or CSV file** containing candidate names, emails, phones, and experience.
- **Then** the system:
  - Parses and whitelists all imported candidate records into the drive's candidate roster.
  - Generates the **Drive Magic Link** (`/drive/{id}/apply`) and **QR Code**.

### Scenario 2: Candidate Whitelist Verification & Live Geolocation Capture
- **Given** a candidate opening the Drive Magic Link:
- **When** the candidate enters their email address:
  - **Whitelist Check**:
    - If the email is **NOT** present in the drive's imported candidate roster, access is **BLOCKED** with a clear message: *"Your email is not registered for this recruitment drive. Please contact your recruiter."*
    - If the email is found in the whitelist, candidate proceeds to info confirmation.
  - **Single-Attempt Verification**:
    - If the candidate has already started or submitted this test previously, access is **BLOCKED**: *"Assessment session already used. Please contact the recruiter to re-enable your attempt."*
  - **Live Geolocation Capture & Proctoring Consent**:
    - Browser requests HTML5 Geolocation permission (Latitude, Longitude, Accuracy, Reverse-geocoded City/Region).
    - If permission is denied or granted, geolocation coordinates and status are securely recorded with the attempt metadata.
    - Candidate acknowledges full-screen and tab-switch proctoring agreement.
- **Then** candidate enters the timed assessment runner. The session is immediately marked `LOCKED_IN_PROGRESS`, preventing any secondary tab or device re-entry.

### Scenario 3: Recruiter Unlocks / Reactivates a Candidate Attempt
- **Given** a candidate who disconnected, faced technical issues, or was locked out:
- **When** the Recruiter views the Candidate 360 tracking drawer for that candidate:
  - Sees status `TEST_LOCKED` or `DISCONNECTED`.
  - Clicks **"Reactivate Candidate Attempt"** button with an optional note.
- **Then** the candidate's lock is reset to allow a one-time fresh or resumed test session.

### Scenario 4: Fast Name-Based Login for L1 and L2 Interviewers
- **Given** an L1 or L2 technical interviewer visiting the platform:
- **When** accessing the Interviewer portal:
  - Instead of entering email/password, the interviewer selects or types their **Name** (e.g. *"David Chen"* or *"Elena Rostova"*).
  - System issues an authenticated interviewer session token instantly scoped to their role (`l1_interviewer` or `l2_interviewer`).
- **Then** the interviewer lands directly in their respective L1 or L2 Pool dashboard.

### Scenario 5: L1 & L2 Review Lifecycle
- **L1 Interviewer**: Claims candidate $\rightarrow$ opens dossier $\rightarrow$ views candidate onboarding data + live location map coordinates + submitted test paper with answer keys $\rightarrow$ submits Pass/Reject.
- **L2 Interviewer**: Claims candidate $\rightarrow$ opens dossier $\rightarrow$ views candidate data + test paper + **L1 interviewer ratings & feedback comments** $\rightarrow$ submits final Pass/Reject verdict.

---

## 4. Functional Requirements

### 4.1 Authentication & Fast Interviewer Access
- **`FR-001`**: System shall require Email & Password authentication for `admin` and `recruiter` roles.
- **`FR-002`**: System shall provide simple **Name-Based Authentication** for `l1_interviewer` and `l2_interviewer` roles without requiring complex credentials.
- **`FR-003`**: Admin portal shall provide role assignment, tenant overview, and system health status.

### 4.2 Drive Management & Excel/CSV Whitelist Import
- **`FR-004`**: Recruiters can create, edit, publish, and delete recruitment drives.
- **`FR-005`**: Recruiters can upload Excel (`.xlsx`, `.xls`) or CSV files to bulk import candidate whitelists (Name, Email, Phone, Experience, Referral).
- **`FR-006`**: System generates persistent Drive Magic Links (`/drive/{id}/apply`) and downloadable/scannable QR Codes.

### 4.3 Candidate Security: Whitelist Check, Single-Attempt Lock & Live Geolocation
- **`FR-007`**: On entering the Magic Link, candidate email must be validated against the drive's imported whitelist. Non-whitelisted emails are strictly rejected.
- **`FR-008`**: Candidate test attempts must enforce a strict **Single-Attempt Lock**. Once started, candidate cannot re-enter the test URL.
- **`FR-009`**: Only Recruiters and Admins can trigger **"Reactivate Attempt"** to allow a locked candidate to resume or re-take the assessment.
- **`FR-010`**: System shall capture candidate **Live Geolocation** (Latitude, Longitude, Timestamp, IP) via HTML5 Geolocation API prior to test launch and log it in the candidate's dossier.
- **`FR-011`**: Dual-device proctoring (Laptop & Mobile Web) shall monitor fullscreen exits, window blurs, and mobile app/tab switches with real-time on-screen warnings and audit logging.

### 4.4 L1 & L2 Interviewer Pools & 360 Tracking
- **`FR-012`**: L1 pool lists `L1_ELIGIBLE` candidates; L1 reviewer can claim, release, view complete test paper answers, and submit Pass/Reject feedback.
- **`FR-013`**: L2 pool lists `L2_ELIGIBLE` candidates; L2 reviewer can claim, release, view candidate test paper + **L1 reviewer ratings & notes**, and submit final selection verdict.
- **`FR-014`**: Recruiter pipeline dashboard shall provide real-time stage filters (`ALL`, `L1_POOL`, `L2_POOL`, `SELECTED`, `REJECTED`), Excel re-export, and Candidate 360 drawers showing live location, test score, proctoring flags, reviewer notes, and rejection reasons.

---

## 5. Success Criteria & Quality Metrics

1. **SC-001**: 100% of non-whitelisted emails attempting to register on a drive magic link are blocked immediately.
2. **SC-002**: 100% of candidate re-entry attempts after test start are locked until explicitly reactivated by the recruiter.
3. **SC-003**: Excel/CSV files with up to 10,000 candidates parse and import into drive whitelist in $<3$ seconds.
4. **SC-004**: L1/L2 interviewers can authenticate by name and open candidate dossiers in $<2$ clicks.
5. **SC-005**: Live geolocation coordinates are captured and displayed in recruiter and reviewer candidate 360 dossiers.
