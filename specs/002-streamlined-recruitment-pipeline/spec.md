# Feature Specification: Streamlined Multi-Actor Recruitment Pipeline (Admin, Recruiter, L1 & L2 Interviewers)

**Feature Directory**: `specs/002-streamlined-recruitment-pipeline/`  
**Status**: Draft  
**Version**: 1.0.0  
**Domain**: Enterprise Recruitment & Interview Lifecycle Management  

---

## 1. Overview & Problem Statement

The previous recruitment setup was overly complex with too many fragmented abstractions. The platform needs a clear, robust, intuitive, and frictionless recruitment operating flow tailored around **four core actors**:
1. **Admin**: System-wide authority, tenant governance, user and role management, audit overview.
2. **Recruiter**: Drives lifecycle owner — creates drives, defines question papers with answers, imports/invites candidates, monitors overall pipelines, tracks candidates end-to-end (stages, scores, rejection reasons), and makes final hiring decisions.
3. **L1 Technical Interviewer**: Claims candidates who cleared the test cutoff score, reviews candidate onboarding metadata (name, email, referral, experience, custom fields) and their submitted test paper with answer breakdown, conducts technical assessment, and submits pass/fail feedback with notes.
4. **L2 Advanced/Panel Interviewer**: Views candidates cleared by L1, reviews complete candidate history (onboarding details, test paper, and L1 feedback/ratings), conducts final technical/architecture round, and submits L2 feedback.

## Clarifications

### Session 2026-08-17
- Q: Can an L1 or L2 Interviewer release/unclaim a candidate back to the pool? → A: Option A (Interviewer can click "Release / Unclaim" to return candidate to pool, and candidates auto-return to pool if untouched after 24 hours).
- Q: When a candidate is rejected, should rejection emails be sent automatically or manually? → A: Drive-Level Configurable (Recruiter configures in drive settings whether rejection emails are dispatched automatically upon rejection or queued for manual batch dispatch).
- Q: Can candidates be directly assigned to specific interviewers? → A: Option B (Strict Self-Claim from Pool: Candidates must be claimed directly from the unassigned L1/L2 pool by the interviewer who will conduct the interview).

---

## 2. Actor Roles & Permissions Matrix

| Capability | Admin | Recruiter | L1 Interviewer | L2 Interviewer | Candidate |
|---|:---:|:---:|:---:|:---:|:---:|
| **User & Tenant Management** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Create & Publish Drives** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Set Question Paper & Answer Keys** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Set Stage Cutoff Criteria (e.g. 70%)** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Import Candidates & Generate Invites** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Take Timed Assessment (OTP)** | ❌ | ❌ | ❌ | ❌ | ✅ Full |
| **End-to-End Candidate Tracking Dashboard** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **View L1 Eligible Candidates Pool** | ✅ Full | ✅ Full | ✅ Unclaimed / Claimed | ❌ | ❌ |
| **Claim L1 Candidate & View Test Paper** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **Submit L1 Interview Feedback (Pass/Fail)** | ✅ Full | ✅ Full | ✅ Own Claimed | ❌ | ❌ |
| **View L2 Eligible Candidates (L1 Cleared)** | ✅ Full | ✅ Full | ❌ | ✅ Unclaimed / Claimed | ❌ |
| **View L2 Candidate Dossier (L1 Notes + Paper)** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **Submit L2 Interview Feedback** | ✅ Full | ✅ Full | ❌ | ✅ Own Claimed | ❌ |
| **Final Hiring Decision & Offer/Rejection** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |

---

## 3. User Scenarios & Acceptance Flows

### Scenario 1: Recruiter Creates Drive with Questions, Answers & Cutoff
- **Given** a logged-in Recruiter:
- **When** the recruiter creates a new drive:
  - Enters Job Title, Description, and required onboarding fields (e.g., Name, Email, Phone, Experience in Years, Referral).
  - Sets an Assessment Paper: selects/creates questions with correct answer keys and marks per question.
  - Sets **L1 Qualifying Cutoff Percentage** (e.g., $\ge 60\%$).
  - Publishes the drive and uploads candidate emails/CSV.
- **Then** the drive becomes `Published` and invitation links with OTP are dispatched to candidates.

### Scenario 2: Candidate Registers & Takes Test
- **Given** a candidate receiving an invitation token:
- **When** the candidate enters `/test/{token}/verify`:
  - Enters email and OTP.
  - Fills required onboarding details (Name, Email, Experience, Referral source).
  - Takes the timed assessment answering MCQs and coding questions with auto-save.
  - Submits the test.
- **Then** system grades the test automatically:
  - If $\text{Score} \ge \text{Cutoff}$, candidate status moves to **`L1_ELIGIBLE`**.
  - If $\text{Score} < \text{Cutoff}$, candidate status moves to **`TEST_REJECTED`** with score and rejection reason recorded.

### Scenario 3: L1 Interviewer Claims Candidate, Reviews Paper & Submits Evaluation
- **Given** an L1 Interviewer logged in:
- **When** navigating to the **L1 Interview Pool**:
  - Sees all candidates in `L1_ELIGIBLE` status (unclaimed or claimed by self).
  - Clicks **"Claim Candidate"** to lock the candidate to themselves (status becomes `L1_IN_PROGRESS`).
  - Opens the candidate dossier:
    - Views candidate details: Name, Email, Phone, Experience, Referral.
    - Views the candidate's submitted test paper: questions, candidate's submitted answers, correct answers, and per-question score.
  - Conducts the interview and submits evaluation:
    - Verdict: **PASS** (Moves to `L2_ELIGIBLE`) or **REJECT** (Moves to `L1_REJECTED`).
    - Rating (1 to 5) and Detailed Feedback Comments.
- **Then** candidate status and L1 feedback are saved and recorded in audit logs.

### Scenario 4: L2 Interviewer Evaluates L1-Cleared Candidate
- **Given** an L2 Interviewer logged in:
- **When** navigating to the **L2 Interview Pool**:
  - Sees all candidates in `L2_ELIGIBLE` status.
  - Clicks **"Claim Candidate"** (status becomes `L2_IN_PROGRESS`).
  - Opens candidate dossier:
    - Views all initial onboarding details and test paper.
    - Views **L1 Interviewer Name, Rating, and L1 Detailed Feedback Notes**.
  - Conducts L2 interview and submits evaluation:
    - Verdict: **PASS** (Moves to `L2_CLEARED` / `FINAL_SELECTION`) or **REJECT** (Moves to `L2_REJECTED`).
    - Rating and L2 Comments.
- **Then** the candidate advances to Recruiter Final Review.

### Scenario 5: Recruiter 360 Tracking & Final Decision
- **Given** a Recruiter viewing the **Drive Pipeline Dashboard**:
- **When** filtering or searching candidates:
  - Sees real-time stage funnel: `Registered` $\rightarrow$ `Test Completed` $\rightarrow$ `L1 Pool` $\rightarrow$ `L2 Pool` $\rightarrow$ `Selected / Rejected`.
  - For any candidate, clicks to view full lifecycle audit:
    - Test score & percentage.
    - L1 interviewer, L1 claim time, L1 rating & rejection reason (if rejected).
    - L2 interviewer, L2 rating, and final feedback.
  - Issues final Offer / Reject status update.

---

## 4. Functional Requirements

### 4.1 Authentication & Role-Based Access Control (RBAC)
- **`FR-001`**: System shall support 4 distinct role scopes: `admin`, `recruiter`, `l1_interviewer`, and `l2_interviewer`.
- **`FR-002`**: Role permissions must be enforced on all backend API routes via dependency injection guards.
- **`FR-003`**: Navigation sidebar and dashboards must dynamically adapt based on the active user's role.

### 4.2 Recruitment Drive & Assessment Paper Management
- **`FR-004`**: Recruiters and Admins shall be able to create, edit, publish, pause, and close recruitment drives.
- **`FR-005`**: Drive setup must allow defining custom onboarding fields (e.g. experience in years, referral source, portfolio).
- **`FR-006`**: Drive setup must include question paper assembly with question text, options/boilerplate, correct answer keys, and individual marks.
- **`FR-007`**: Drive setup must define a configurable Cutoff Percentage (%) to qualify for L1, and an option to toggle automated candidate rejection emails on/off upon stage failure.

### 4.3 Candidate Assessment Execution & Auto-Grading
- **`FR-008`**: Candidates access tests via zero-account magic token + OTP.
- **`FR-009`**: Candidate onboarding form must capture Name, Email, Experience, Referral, and custom fields before test start.
- **`FR-010`**: System shall evaluate answers upon submission:
  - Candidates scoring $\ge \text{Cutoff}$ automatically transition to `L1_ELIGIBLE`.
  - Candidates scoring $< \text{Cutoff}$ transition to `TEST_REJECTED` with exact score logged.

### 4.4 L1 Interviewer Pool & Claim Workflow
- **`FR-011`**: L1 pool endpoint shall list candidates with status `L1_ELIGIBLE` or claimed by current L1 user.
- **`FR-012`**: L1 interviewer can click **"Claim"**, locking candidate to their `user_id` and setting status to `L1_IN_PROGRESS`. L1 interviewers can also click **"Release / Unclaim"** to return the candidate to the pool, and claimed candidates auto-release back to pool if no feedback is submitted within 24 hours.
- **`FR-013`**: L1 dossier shall display:
  - Candidate profile & onboarding answers (experience, referral, etc.).
  - Submitted assessment paper with question text, chosen answers, correct answers, and scores.
- **`FR-014`**: L1 interviewer can submit feedback: Verdict (`PASS` / `REJECT`), 1-5 rating, and notes.
  - On `PASS`, candidate transitions to `L2_ELIGIBLE`.
  - On `REJECT`, candidate transitions to `L1_REJECTED` with reason recorded.

### 4.5 L2 Interviewer Pool & Claim Workflow
- **`FR-015`**: L2 pool endpoint shall list candidates with status `L2_ELIGIBLE` or claimed by current L2 user.
- **`FR-016`**: L2 interviewer can click **"Claim"**, locking candidate to `L2_IN_PROGRESS`, with ability to release/unclaim and automatic 24h expiration.
- **`FR-017`**: L2 dossier shall display candidate profile, test paper, AND **L1 feedback notes & score**.
- **`FR-018`**: L2 interviewer submits evaluation: Verdict (`PASS` / `REJECT`), rating, and notes.
  - On `PASS`, candidate transitions to `L2_CLEARED` (or `SELECTED`).
  - On `REJECT`, candidate transitions to `L2_REJECTED` with reason recorded.

### 4.6 Recruiter End-to-End Tracking & Candidate 360
- **`FR-019`**: Recruiter dashboard must provide a unified tracking board with filters by stage (`ALL`, `TEST_PENDING`, `L1_POOL`, `L2_POOL`, `SELECTED`, `REJECTED`).
- **`FR-020`**: Candidate drawer/modal must display complete audit trail:
  - Test Score & Cutoff comparison.
  - L1 Interviewer, claim timestamp, rating, feedback comments.
  - L2 Interviewer, rating, feedback comments.
  - Rejection stage and reason (if rejected).

---

## 5. Success Criteria & Quality Metrics

1. **SC-001**: Role switching and permissions barriers function with 100% tenant and role isolation.
2. **SC-002**: L1 and L2 interviewers can claim, view complete test paper answers, and submit evaluations in $<3$ clicks.
3. **SC-003**: Candidates scoring above cutoff appear in L1 pool within $<1$ second of test submission.
4. **SC-004**: Recruiters have 100% visibility into where every candidate stands, who evaluated them, and exact rejection reasons.
