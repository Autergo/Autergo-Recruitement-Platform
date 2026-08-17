# Feature Specification: Streamlined Multi-Actor Recruitment Pipeline (Admin, Recruiter, L1 & L2 Interviewers)

**Feature Directory**: `specs/002-streamlined-recruitment-pipeline/`  
**Status**: Draft  
**Version**: 1.1.0  
**Domain**: Enterprise Recruitment & Interview Lifecycle Management  

---

## 1. Overview & Problem Statement

The platform is designed around **four primary actors** with a direct, frictionless recruitment operating model:
1. **Admin**: System-wide tenant, user & role management, platform overview.
2. **Recruiter**: Creates recruitment drives, sets assessment papers with answer keys and cutoffs, receives a **Drive Magic Link / QR Code** to share with candidates, monitors pipeline stages, and tracks candidate 360 dossiers.
3. **L1 Technical Interviewer**: Claims candidates who cleared the test cutoff score, reviews candidate onboarding profile (name, email, referral, experience) and their exact submitted test paper with answer grading, conducts technical assessment, and submits pass/fail evaluation.
4. **L2 Advanced/Panel Interviewer**: Views candidates cleared by L1, reviews full history (onboarding profile, test paper, and **L1 interviewer ratings & feedback comments**), conducts final technical/architecture round, and submits L2 evaluation.

---

## 2. Clarifications

### Session 2026-08-17
- **Q1**: Can an L1 or L2 Interviewer release/unclaim a candidate back to the pool? → **A**: Option A (Interviewer can click "Release / Unclaim" to return candidate to pool, and candidates auto-return to pool if untouched after 24 hours).
- **Q2**: When a candidate is rejected, should rejection emails be sent automatically or manually? → **A**: Drive-Level Configurable (Recruiter toggles in drive settings whether rejection emails are dispatched automatically or queued).
- **Q3**: Can candidates be directly assigned to specific interviewers? → **A**: Option B (Strict Self-Claim from Pool: Candidates must be claimed directly from the unassigned L1/L2 pool by the interviewer).
- **Q4**: How does the candidate enter the test and what proctoring applies? → **A**: Recruiter receives a shareable Drive Magic Link & QR Code. Candidate visits link, enters email, fills onboarding info (Name, Email, Experience, Referral), acknowledges a prominent Proctoring Consent Warning (Full-screen enforcement & Tab-switch logging), and takes the test on either Laptop or Mobile Web.

---

## 3. Actor Roles & Permissions Matrix

| Capability | Admin | Recruiter | L1 Interviewer | L2 Interviewer | Candidate |
|---|:---:|:---:|:---:|:---:|:---:|
| **User & Tenant Management** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Create Drive & Generate Magic Link / QR** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Set Question Paper & Answer Keys** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Set Stage Cutoff Criteria (e.g. 70%)** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Import Candidates & Generate Invites** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Access Magic Link / QR Code & Fill Info** | ❌ | ❌ | ❌ | ❌ | ✅ Full |
| **Proctoring Agreement (Fullscreen / Tab-Switch)** | ❌ | ❌ | ❌ | ❌ | ✅ Full |
| **Take Timed Assessment (Laptop & Mobile Web)** | ❌ | ❌ | ❌ | ❌ | ✅ Full |
| **End-to-End Candidate Tracking Dashboard** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **View L1 Eligible Candidates Pool** | ✅ Full | ✅ Full | ✅ Unclaimed / Claimed | ❌ | ❌ |
| **Claim L1 Candidate & View Test Paper** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **Submit L1 Interview Feedback (Pass/Fail)** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **View L2 Eligible Candidates (L1 Cleared)** | ✅ Full | ✅ Full | ❌ | ✅ Unclaimed / Claimed | ❌ |
| **View L2 Candidate Dossier (L1 Notes + Paper)** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **Submit L2 Interview Feedback** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **Final Hiring Decision & Offer/Rejection** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |

---

## 4. User Scenarios & Acceptance Flows

### Scenario 1: Recruiter Creates Drive & Gets Magic Link / QR Code
- **Given** a logged-in Recruiter:
- **When** the recruiter creates a new drive:
  - Enters Job Title, Description, and required onboarding fields (Experience in Years, Referral source, Phone).
  - Configures Question Paper with questions, options, boilerplate code, marks, and answer keys.
  - Sets Cutoff Percentage (e.g. 60%) and rejection email toggle.
  - Clicks **Publish Drive**.
- **Then** the system creates the drive and displays:
  - Unique **Drive Public Magic Link** (e.g., `/drive/{drive_slug_or_id}/apply`).
  - Scannable **QR Code** for instant sharing with mobile/laptop candidates.

### Scenario 2: Candidate Registers, Acknowledges Proctoring & Takes Test
- **Given** a candidate scanning the QR code or clicking the Drive Magic Link:
- **When** the candidate opens the link:
  - **Step 1: Email Entry**: Enters email address.
  - **Step 2: Candidate Info Page**: Fills Name, Phone, Total Experience (Years), Referral Source, and custom fields.
  - **Step 3: Proctoring Agreement & Warning**:
    - System displays full-screen proctoring policy warning.
    - Warns that leaving full-screen, switching browser tabs, or minimizing window logs violation telemetry.
    - Device detection recognizes whether candidate is on **Laptop Browser** or **Mobile Web**.
    - Candidate clicks **"I Agree & Start Assessment"**.
  - **Step 4: Assessment Runner**:
    - Full-screen mode is requested/locked.
    - Candidate solves MCQs and coding challenges with live auto-save.
    - Responsive layout accommodates both desktop Monaco editor and mobile-friendly touch inputs.
    - Tab switches and window blurs trigger on-screen warnings and log telemetry flags.
  - **Step 5: Submission & Auto-Grading**:
    - Candidate submits or timer expires.
    - If $\text{Score} \ge \text{Cutoff}$, candidate automatically transitions to **`L1_ELIGIBLE`**.
    - If $\text{Score} < \text{Cutoff}$, candidate transitions to **`TEST_REJECTED`** with exact score and reason logged.

### Scenario 3: L1 Interviewer Claims Candidate, Reviews Paper & Submits Evaluation
- **Given** an L1 Interviewer logged in:
- **When** navigating to the **L1 Interview Pool**:
  - Views all candidates with status `L1_ELIGIBLE` (unclaimed or claimed by self).
  - Clicks **"Claim Candidate"** to lock the candidate to themselves (`L1_IN_PROGRESS`). Can also click "Release" to return to pool.
  - Opens the candidate dossier:
    - Candidate profile details (Name, Email, Experience, Referral, Device type).
    - Full submitted test paper: questions, candidate's submitted answers, correct answers, test score, and tab-switch proctoring count.
  - Submits evaluation: Verdict (**PASS** $\rightarrow$ `L2_ELIGIBLE` or **REJECT** $\rightarrow$ `L1_REJECTED`), 1-5 rating, and detailed comments.

### Scenario 4: L2 Interviewer Evaluates L1-Cleared Candidate
- **Given** an L2 Interviewer logged in:
- **When** navigating to the **L2 Interview Pool**:
  - Views candidates in `L2_ELIGIBLE` pool.
  - Clicks **"Claim Candidate"** (`L2_IN_PROGRESS`).
  - Opens dossier:
    - All initial candidate info & submitted test paper.
    - **L1 Interviewer Name, Rating (1-5), and L1 Feedback Notes**.
  - Submits evaluation: Verdict (**PASS** $\rightarrow$ `L2_CLEARED` or **REJECT** $\rightarrow$ `L2_REJECTED`), rating, and notes.

### Scenario 5: Recruiter 360 Tracking & Pipeline Control
- **Given** a Recruiter viewing the **Drive Pipeline Dashboard**:
- **When** viewing the candidate tracking table:
  - Real-time status badges: `Test In Progress` $\rightarrow$ `Test Rejected` $\rightarrow$ `L1 Pool (Unclaimed/Claimed)` $\rightarrow$ `L2 Pool` $\rightarrow$ `Selected / Rejected`.
  - Recruiter can inspect candidate drawer:
    - Initial registration info & device type (Laptop / Mobile).
    - Test score vs cutoff, tab-switch count.
    - L1 interviewer name, score, rejection reason (if rejected).
    - L2 interviewer name, score, and final notes.

---

## 5. Functional Requirements

### 5.1 Drive Creation & Magic Link / QR Code
- **`FR-001`**: Recruiter/Admin creates drive with job description, onboarding fields, question paper, and cutoff score.
- **`FR-002`**: System generates a unique, persistent **Drive Magic Link** (e.g. `/drive/{id}/apply`) and renders a scannable **QR Code** (PNG/SVG) on the recruiter dashboard for distribution.

### 5.2 Candidate Onboarding & Device-Aware Proctoring
- **`FR-003`**: Candidate opens magic link/QR code, enters email, and fills required profile info (Name, Phone, Experience, Referral).
- **`FR-004`**: System renders a prominent **Proctoring Warning & Agreement Screen** detailing full-screen requirement and tab-switch logging before test activation.
- **`FR-005`**: System detects runtime device mode:
  - **Laptop/Desktop Web**: Enforces HTML5 Fullscreen API and browser blur/visibilitychange event listeners.
  - **Mobile Web**: Enforces Page Visibility API and mobile app-switch/tab-blur event listeners with responsive touch layouts.
- **`FR-006`**: Tab switches and window leaves display warnings and log proctoring telemetry flags.
- **`FR-007`**: System auto-grades test on submission:
  - $\text{Score} \ge \text{Cutoff} \implies$ Status `L1_ELIGIBLE`.
  - $\text{Score} < \text{Cutoff} \implies$ Status `TEST_REJECTED`.

### 5.3 L1 & L2 Interviewer Pools & Reviewer Dossiers
- **`FR-008`**: L1 pool lists `L1_ELIGIBLE` candidates; L1 interviewer can **Claim** or **Release** candidate.
- **`FR-009`**: L1 dossier presents candidate info, test paper with submitted vs correct answers, and proctoring telemetry summary.
- **`FR-010`**: L1 feedback submission advances candidate to `L2_ELIGIBLE` (on Pass) or `L1_REJECTED` (on Reject).
- **`FR-011`**: L2 pool lists `L2_ELIGIBLE` candidates; L2 interviewer can Claim or Release candidate.
- **`FR-012`**: L2 dossier presents candidate profile, test paper, AND **L1 interviewer ratings & feedback comments**.
- **`FR-013`**: L2 feedback submission advances candidate to `L2_CLEARED` (on Pass) or `L2_REJECTED` (on Reject).

### 5.4 Recruiter Pipeline & Candidate 360 Tracking
- **`FR-014`**: Recruiter dashboard provides real-time search and filter across all stages (`ALL`, `TEST_PENDING`, `L1_POOL`, `L2_POOL`, `SELECTED`, `REJECTED`).
- **`FR-015`**: Candidate drawer displays complete chronological audit:
  - Onboarding details (experience, referral, device).
  - Assessment score, cutoff threshold, proctoring flags.
  - L1 reviewer, rating, and rejection notes (if any).
  - L2 reviewer, rating, and final feedback.
