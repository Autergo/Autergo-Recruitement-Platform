# Feature Specification: Autergo Enterprise Recruitment Platform (V1 MVP)

**Feature Branch**: `001-autergo-recruitment-platform`

**Created**: 2026-08-14

**Status**: Draft

**Input**: User description: "Enterprise-level AI-powered recruitment platform — scalable, durable, trustable, fully secure. Synthesized from product details, complete product blueprint, and enterprise platform design documents."

## Clarifications

### Session 2026-08-14
- Q: What is the exact session recovery policy and grace period when a candidate loses internet connectivity or their browser crashes mid-assessment? → A: Standard 15-minute recovery grace period with server timer pause during disconnect.
- Q: Which programming languages and execution environments must be supported in the V1 sandboxed coding assessment engine? → A: Tiered Multi-Language: Python, JavaScript/TypeScript, Java, C++, and SQL with unit test assertions.
- Q: What is the evidence media retention and storage strategy for proctoring sessions? → A: Event-driven snapshots: capture timestamped webm/jpeg clips only when high-severity anomalies trigger (multiple faces, phone detected, second voice).
- Q: How should the scoring engine handle the balance between synchronous deterministic scoring and asynchronous AI subjective evaluation? → A: Hybrid Engine: Synchronous deterministic scoring for objective questions (MCQs/code tests) and async background worker queue for AI-assisted subjective evaluation.
- Q: What real-time communication protocol and fallback mechanism must be used between candidate assessment clients and the live recruiter dashboard? → A: Dual-channel delivery: WebSockets for low-latency updates with automated fallback to HTTP long-polling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Recruiter Creates and Publishes a Recruitment Drive (Priority: P1)

A recruiter logs into Autergo, creates a new recruitment drive for an open role, configures the job details, eligibility criteria, candidate registration form, assessment sections with questions, proctoring policy, interview stages, and communication templates. Once reviewed, the recruiter publishes the drive and invites candidates.

**Why this priority**: The recruitment drive is the central domain object of the entire platform. Without it, no other workflow can function. This is the foundational user journey.

**Independent Test**: Can be fully tested by logging in as a recruiter, walking through the 8-step drive builder wizard, publishing the drive, and verifying that an invitation link is generated and candidates appear in the pool.

**Acceptance Scenarios**:

1. **Given** a recruiter is logged in and the organization exists, **When** the recruiter creates a new drive and fills in job title, description, and required skills, **Then** the drive is saved in draft state with all job details persisted.
2. **Given** a draft drive exists, **When** the recruiter configures eligibility rules (degree, CGPA thresholds, experience range), **Then** only candidates meeting those criteria are eligible for the drive.
3. **Given** a draft drive with a configured assessment, **When** the recruiter clicks "Publish," **Then** the drive becomes active and a shareable invitation link is generated.
4. **Given** a published drive, **When** the recruiter imports a CSV of candidate emails, **Then** personalized invitation emails are sent to each candidate and their status becomes INVITED.

---

### User Story 2 — Candidate Takes an Assessment Without Account Creation (Priority: P1)

A candidate receives an invitation email with a secure link, clicks through to an identity verification flow (OTP/email verification), completes a system readiness check (camera, microphone, browser), reads the instructions, and begins a timed assessment. The candidate answers MCQ, coding, and other questions while AI proctoring monitors in the background. On completion, the candidate submits and receives confirmation.

**Why this priority**: Frictionless candidate access is a core product principle. The entire value proposition depends on candidates being able to take assessments without creating accounts.

**Independent Test**: Can be tested by clicking an invitation link, completing verification, passing the system check, answering questions, and submitting — all without registering a permanent account.

**Acceptance Scenarios**:

1. **Given** a candidate has a valid invitation token, **When** they click the link, **Then** they are taken to an identity verification screen without any account registration requirement.
2. **Given** a candidate has verified their identity via OTP, **When** the system readiness check passes (camera, mic, browser), **Then** a secure assessment session is created and bound to the candidate's device.
3. **Given** a candidate is in an active assessment session, **When** their internet disconnects and they reconnect within the configured grace period, **Then** their session resumes with all previously saved answers intact.
4. **Given** a candidate has answered all questions, **When** they click "Submit," **Then** the submission is recorded as final and the session becomes locked.
5. **Given** a candidate has an active session, **When** someone attempts to open the same invitation on a different device, **Then** the second attempt is blocked with a message indicating an active session exists.

---

### User Story 3 — Recruiter Monitors a Live Drive from the Command Center (Priority: P1)

While candidates are actively taking assessments, the recruiter opens the Live Drive Command Center. The recruiter sees real-time counts (invited, started, active, completed, flagged), an assessment progress bar, proctoring alerts categorized by severity (critical, suspicious, watch), and a candidate monitor table with individual risk scores and completion status. The recruiter can pause the drive, extend time, send broadcast messages, or terminate specific candidate sessions.

**Why this priority**: Real-time operational visibility during high-volume drives is a key enterprise differentiator and directly impacts drive quality.

**Independent Test**: Can be tested by starting a drive with multiple test candidates, monitoring the live dashboard, and verifying that candidate states, alerts, and controls update in near real-time.

**Acceptance Scenarios**:

1. **Given** a drive is live with active candidates, **When** the recruiter opens the command center, **Then** they see real-time candidate counts, progress metrics, and alerts that update without manual page refresh.
2. **Given** a proctoring event with critical severity is detected, **When** it appears in the recruiter dashboard, **Then** it shows the candidate name, event type, confidence score, timestamp, and available evidence.
3. **Given** the recruiter selects a flagged candidate, **When** they choose "Terminate Session," **Then** the candidate's session ends immediately and the action is logged in the audit trail.
4. **Given** a technical issue (e.g., camera permission failure) occurs for a candidate, **When** it is reported to the command center, **Then** it appears under "Technical Issues" distinct from proctoring alerts.

---

### User Story 4 — AI-Powered Multi-Signal Proctoring with Human Review (Priority: P2)

During a candidate's assessment, the proctoring engine collects signals from camera (face detection, multiple faces, phone detection), browser (tab switching, fullscreen exit, copy/paste), and audio (speech detection, multiple voices). These signals feed into a Risk Engine that calculates a weighted suspicion score. Events are displayed on a suspicion timeline. After the assessment, integrity reviewers inspect the evidence, view timestamped event clips, and decide whether to confirm a violation, ignore the event, or mark for further review. No candidate is automatically rejected based on the risk score.

**Why this priority**: Multi-signal proctoring is a major product differentiator and the evidence-based approach (never auto-rejecting from a single signal) is a core product principle.

**Independent Test**: Can be tested by simulating proctoring events (tab switch, second face), verifying the risk score calculation, and confirming a reviewer can inspect evidence and record a decision.

**Acceptance Scenarios**:

1. **Given** a candidate's camera detects a second face, **When** the event is processed, **Then** a proctoring event is recorded with event type, confidence score, timestamp, evidence reference, and AI model version.
2. **Given** multiple proctoring events have occurred for a candidate, **When** the Risk Engine calculates the suspicion score, **Then** the score reflects the configurable weighted sum of all detected signals.
3. **Given** a candidate has a risk score above the "Suspicious" threshold, **When** a reviewer opens the evidence view, **Then** they see a chronological suspicion timeline with each event, its confidence, and linked evidence.
4. **Given** a reviewer inspects an event, **When** they select "Confirm Violation," "Ignore," or "Mark for Review," **Then** the decision is recorded with the reviewer identity and timestamp in the audit log.

---

### User Story 5 — Assessment Builder with Question Bank and AI Generation (Priority: P2)

A recruiter uses the Assessment Builder to create a multi-section assessment. They can manually select questions from the Question Bank (organized by skill, topic, difficulty), or use the AI Question Engine to generate questions by specifying the role, experience level, difficulty distribution, and skill percentages. AI-generated questions go through validation (answer verification, duplicate detection, difficulty classification) before entering the question pool. The recruiter then drags approved questions into the final paper, can create multiple equivalent paper versions (A/B/C/D), and previews the assessment before attaching it to a drive.

**Why this priority**: The assessment engine is the core evaluation mechanism. AI question generation dramatically reduces recruiter effort for high-volume drives.

**Independent Test**: Can be tested by creating a question bank, generating AI questions for a role, validating them, building a multi-section paper, and verifying paper versions maintain equivalent skill/difficulty distributions.

**Acceptance Scenarios**:

1. **Given** a recruiter specifies role, experience, difficulty, and skill distribution, **When** they request AI question generation, **Then** a pool of candidate questions is generated, each tagged with skill, topic, difficulty, marks, and expected time.
2. **Given** AI-generated questions exist in the pool, **When** the recruiter reviews them, **Then** each question shows whether it passed validation (answer verification, duplicate check, difficulty classification) and whether it has been human-verified.
3. **Given** approved questions are available, **When** the recruiter creates Paper A with specific skill/difficulty distribution, **Then** Paper B/C/D are generated maintaining approximately equivalent distributions.
4. **Given** the recruiter drags questions into a final paper, **When** they preview it, **Then** the preview shows the assessment exactly as a candidate would experience it.

---

### User Story 6 — Interview Scheduling, AI-Assisted Interviewing, and Evaluation (Priority: P2)

After shortlisting candidates based on assessment scores and proctoring review, the recruiter schedules interview rounds (technical, manager, HR). Interviewers receive assigned candidates along with context from the Candidate 360 profile. The AI interviewer suggests questions based on the job description, candidate's resume, and assessment gaps (e.g., weak SQL score triggers more SQL questions). Interviewers submit structured evaluations using configurable rubrics (technical knowledge, problem solving, communication, culture fit) with 1–5 ratings and free-text comments. AI generates an evidence-grounded summary but the recommendation (Strong Hire / Hire / Hold / Reject) is always a human decision.

**Why this priority**: Interview management completes the recruitment lifecycle. AI-assisted questioning improves interview quality by targeting candidate weaknesses.

**Independent Test**: Can be tested by shortlisting candidates, scheduling interviews, viewing AI question suggestions based on assessment gaps, and submitting structured evaluations.

**Acceptance Scenarios**:

1. **Given** a candidate is shortlisted, **When** the recruiter schedules a technical interview round, **Then** the assigned interviewer receives a notification with the candidate's 360 profile (assessment scores, resume summary, proctoring status).
2. **Given** a candidate scored low in SQL but high in Python, **When** the AI interviewer generates question suggestions, **Then** the suggestions are weighted toward SQL topics rather than repeating Python questions.
3. **Given** an interviewer completes an interview, **When** they submit the evaluation, **Then** the structured rubric scores and comments are recorded and the AI generates an evidence-grounded summary.
4. **Given** a candidate has completed all interview rounds, **When** the hiring manager views the Candidate 360, **Then** they see the consolidated scorecard with assessment, interview, and proctoring evidence and can make a final hiring decision.

---

### User Story 7 — Automated Communication Workflows (Priority: P3)

The platform sends event-triggered communications throughout the recruitment lifecycle: registration confirmation, assessment link, 24-hour reminders, completion confirmation, shortlist notifications, interview invitations, rejection emails, and offer communications. Recruiters configure email templates with safe variables ({{candidate.name}}, {{job.title}}, {{interview.date}}, {{company.name}}). Templates are validated before sending to ensure all variables resolve. The system initially supports email, with architecture to support SMS and WhatsApp later.

**Why this priority**: Communication automation reduces manual recruiter workload but is less technically complex than the core assessment and proctoring engines.

**Independent Test**: Can be tested by configuring templates for each trigger event, running a drive through the full lifecycle, and verifying that the correct emails are sent at each stage with properly resolved variables.

**Acceptance Scenarios**:

1. **Given** a candidate registers for a drive, **When** the CANDIDATE_REGISTERED event fires, **Then** the configured registration confirmation email is sent with the candidate's name and drive details.
2. **Given** a recruiter creates an email template with variables, **When** they attempt to save it with an unresolvable variable, **Then** the system reports a validation error before saving.
3. **Given** an assessment is scheduled for tomorrow, **When** the 24-hour reminder window is reached, **Then** a reminder email is sent to all candidates who have not yet started.
4. **Given** a candidate is shortlisted, **When** the CANDIDATE_SHORTLISTED event fires, **Then** an interview invitation email with date, time, and join link is sent automatically.

---

### User Story 8 — Organization, Multi-Tenancy, RBAC, and Audit (Priority: P1)

An organization admin registers their company on Autergo, sets up the organization profile, invites team members, and assigns roles (Organization Admin, Recruitment Manager, Recruiter, Hiring Manager, Interviewer, Reviewer). Each role has specific permissions. All data is isolated by tenant. Every important action (drive configuration changes, candidate status changes, proctoring decisions, interview evaluations) is recorded in an immutable audit log with actor, action, resource, old value, new value, timestamp, IP, and device metadata.

**Why this priority**: Multi-tenancy, RBAC, and auditability are enterprise non-negotiables and constitutional principles. They underpin every other feature.

**Independent Test**: Can be tested by creating an organization, assigning roles, verifying permission enforcement (e.g., an Interviewer cannot create drives), and checking that audit logs capture all actions.

**Acceptance Scenarios**:

1. **Given** an organization admin is logged in, **When** they invite a user and assign the "Recruiter" role, **Then** the invited user can create drives and manage candidates but cannot modify organization settings.
2. **Given** a user with the "Interviewer" role, **When** they attempt to access drive configuration, **Then** they are denied access.
3. **Given** Company A and Company B both use Autergo, **When** a Company A recruiter queries candidates, **Then** they see only Company A candidates, with no data leakage from Company B.
4. **Given** an admin changes an assessment duration from 60 to 90 minutes, **When** the change is saved, **Then** an audit log entry is created with the actor, the specific change, old and new values, and a timestamp.

---

### Edge Cases

- What happens when a candidate's browser crashes mid-assessment? → Session resumes within a standard 15-minute recovery grace period with server timer paused during disconnection, preserving all previously auto-saved answers intact.
- How does the system handle 5,000 candidates submitting assessments within the same 60-second window? → Submissions are validated and persisted synchronously; scoring, analytics, and AI processing are queued asynchronously via background workers.
- What happens when a proctoring camera disconnects? → A CAMERA_DISCONNECTED event is logged with timestamp; the candidate can continue but the event contributes to the risk score; the recruiter is alerted.
- What happens when a recruiter tries to delete a drive that has active candidate sessions? → The system prevents deletion and requires the recruiter to either complete or terminate all active sessions first.
- How does the system handle concurrent login attempts by the same recruiter? → Standard session management with the most recent session active; no data corruption from race conditions.
- What happens when AI question generation produces duplicate or incorrect questions? → Validation pipeline detects duplicates via similarity check and verifies answers; flagged questions are excluded from the pool until human review.

## Requirements *(mandatory)*

### Functional Requirements

**Organization & Multi-Tenancy**
- **FR-001**: System MUST support multi-tenant architecture where every entity (drive, candidate, question, evaluation) is scoped to a tenant_id.
- **FR-002**: System MUST enforce tenant data isolation at the API and database layers such that no cross-tenant data access is possible.

**Authentication & RBAC**
- **FR-003**: System MUST authenticate recruiters and organizational users via session-based authentication with short-lived tokens and secure refresh mechanisms.
- **FR-004**: System MUST enforce role-based access control with at minimum these roles: Organization Admin, Recruitment Manager, Recruiter, Hiring Manager, Interviewer, Reviewer.
- **FR-005**: System MUST authenticate candidates via invitation token + OTP/email verification without requiring permanent account creation.

**Recruitment Drive**
- **FR-006**: System MUST allow recruiters to create recruitment drives with configurable stages (Registration, Assessment, Interview rounds, Final Decision).
- **FR-007**: System MUST support a drive builder wizard with steps for Job, Eligibility, Candidate Form, Assessment, Proctoring, Interview, Communication, and Review & Publish.
- **FR-008**: System MUST support drive lifecycle states: Draft, Published/Active, Live, Paused, Completed, Archived.
- **FR-009**: System MUST allow recruiters to define eligibility criteria (degree, CGPA, experience, location) that filter candidates at registration.
- **FR-010**: System MUST support configurable custom candidate fields (text, number, dropdown, multi-select, date, file, checkbox, URL, resume) with validation rules.

**Candidate Management**
- **FR-011**: System MUST support bulk candidate import via CSV upload with email-based invitation.
- **FR-012**: System MUST track candidates through a complete state machine: INVITED → REGISTERED → VERIFIED → READY → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED → FINAL_REVIEW → SELECTED/REJECTED/HOLD.
- **FR-013**: System MUST allow session resumption after network disconnection within a 15-minute grace period, pausing the assessment countdown timer during disconnection while preserving all auto-saved answers.
- **FR-014**: System MUST enforce single active session per candidate, blocking concurrent access from different devices.
- **FR-015**: System MUST allow authorized HR to terminate or reassign a candidate session.

**Assessment Engine**
- **FR-016**: System MUST support multiple question types: single-correct MCQ, multiple-correct MCQ, true/false, coding (with code editor), SQL, short answer, and long answer.
- **FR-017**: System MUST support multi-section assessments with per-section timing, marks, and skill/topic configuration.
- **FR-018**: System MUST implement server-authoritative timing with auto-submission on time expiry.
- **FR-019**: System MUST auto-save candidate answers incrementally to prevent data loss.
- **FR-020**: System MUST support a hybrid scoring engine: execute deterministic scoring synchronously for objective questions (MCQs, true/false, coding test assertions) during submission, and enqueue background worker tasks for asynchronous AI subjective answer evaluation and risk aggregation.
- **FR-021**: System MUST support secure sandboxed code execution for Python, JavaScript/TypeScript, Java, C++, and SQL with automated evaluation against public and hidden test cases.

**Question Bank & AI Generation**
- **FR-022**: System MUST maintain a central question bank with metadata: skill, topic, difficulty, question type, marks, expected time, tags, version, AI-generated flag, human-verified flag, usage count, and success rate.
- **FR-023**: System MUST support AI-powered question generation based on role, experience level, skill distribution, and difficulty distribution.
- **FR-024**: System MUST validate AI-generated questions through answer verification, duplicate/similarity detection, and difficulty classification before adding to the pool.
- **FR-025**: System MUST support creation of multiple paper versions (A/B/C/D) maintaining equivalent skill and difficulty distributions.
- **FR-026**: System MUST provide a drag-and-drop interface for recruiters to build final assessment papers from the question pool.

**AI Proctoring**
- **FR-027**: System MUST collect proctoring signals from camera (face presence, multiple faces, phone detection), browser (tab switch, fullscreen exit, copy/paste), and audio (speech detection, multiple voices).
- **FR-028**: System MUST run lightweight CV inference (face detection, phone detection) on the candidate's device, sending telemetry events continuously and uploading short timestamped media clips (JPEG/WebM) to encrypted object storage only when high-severity anomalies are triggered.
- **FR-029**: System MUST calculate a weighted risk score from collected proctoring events using configurable signal weights and severity thresholds.
- **FR-030**: System MUST record each proctoring event with event_id, candidate_id, session_id, drive_id, event_type, timestamp, confidence, severity, secure signed evidence media reference, and model_version.
- **FR-031**: System MUST provide a suspicion timeline view for each candidate showing chronological proctoring events with evidence links.
- **FR-032**: System MUST allow reviewers to adjudicate proctoring events (Confirm Violation / Ignore / Mark for Review) without automatic candidate rejection.

**Interview Engine**
- **FR-033**: System MUST support multiple interview modes: Human, Technical, Coding, Panel, AI-assisted, and HR.
- **FR-034**: System MUST support configurable interview rounds per drive (e.g., Round 1: Assessment, Round 2: Technical, Round 3: Manager, Round 4: HR).
- **FR-035**: System MUST provide structured evaluation forms with configurable rubrics (1–5 rating scales for technical knowledge, problem solving, communication, leadership, culture fit) and free-text comments.
- **FR-036**: System MUST support AI-generated interview question suggestions based on job description, candidate resume, and assessment result gaps.
- **FR-037**: System MUST generate AI-powered candidate summaries that are evidence-grounded and traceable to source data.

**Candidate 360**
- **FR-038**: System MUST consolidate all candidate data (resume, assessment scores, coding results, interview evaluations, proctoring risk, communication history) into a unified Candidate 360 profile view.
- **FR-039**: System MUST calculate a role-match percentage based on job requirements mapped against the candidate's skill matrix.
- **FR-040**: System MUST provide a scorecard with final decision options (Strong Hire / Hire / Hold / Reject) where the hiring decision is always made by a human.

**Communication Engine**
- **FR-041**: System MUST support event-triggered email communications for key lifecycle events (registration, assessment scheduled, reminder, completion, shortlist, interview invitation, rejection, offer).
- **FR-042**: System MUST support configurable email templates with safe variable substitution ({{candidate.name}}, {{job.title}}, {{interview.date}}, {{company.name}}).
- **FR-043**: System MUST validate email templates to detect unresolvable variables before allowing the template to be used.

**Analytics & Reporting**
- **FR-044**: System MUST provide drive funnel analytics: Invited → Registered → Started → Completed → Qualified → Interviewed → Shortlisted → Selected.
- **FR-045**: System MUST display score distributions, skill-level performance, question analytics (correctness rate, average response time, skip rate), and proctoring metrics.

**Audit & Security**
- **FR-046**: System MUST record an immutable audit log entry for every important action with: actor, action, resource, old value, new value, timestamp, IP, and device metadata.
- **FR-047**: System MUST encrypt all data at rest and in transit.
- **FR-048**: System MUST implement rate limiting on all public and authenticated API endpoints.
- **FR-049**: System MUST enforce input validation, CSRF protection, and CORS policies on all endpoints.

**Real-Time Operations**
- **FR-050**: System MUST provide dual-channel real-time communication: WebSockets as primary transport for candidate status, telemetry, and proctoring alerts (<5s latency), with automated client fallback to HTTP long-polling during network degradation.
- **FR-051**: System MUST support drive control operations: Pause Drive, Resume Drive, Extend Time, Terminate Candidate, Reopen Candidate, Send Reminder, Broadcast Message.

### Key Entities

- **Organization**: A tenant/company using the platform. Contains users, drives, settings, and branding.
- **User**: A member of an organization with an assigned role (Admin, Manager, Recruiter, Interviewer, etc.).
- **Recruitment Drive**: The central domain object containing job, eligibility, stages, assessment, proctoring policy, interviews, and communications.
- **Drive Stage**: A configurable step in the recruitment pipeline (Registration, Assessment, Interview Round N, Final Decision).
- **Candidate**: A recruitment participant identified by email, tracked through the full state machine lifecycle.
- **Application**: A candidate's enrollment in a specific drive, carrying custom field values and status.
- **Assessment**: A configured evaluation attached to a drive, containing sections and questions.
- **Question**: An item in the question bank with skill, difficulty, type, metadata, and version history.
- **Assessment Attempt**: A candidate's session for taking an assessment, with answers, timing, and proctoring reference.
- **Proctor Session / Proctor Event**: Integrity monitoring records with signals, confidence, evidence, and adjudication state.
- **Risk Score**: An aggregated suspicion metric calculated from weighted proctoring events.
- **Interview**: A scheduled interview round with assigned interviewer(s) and evaluation rubric.
- **Interview Evaluation**: Structured rubric scores, comments, and recommendation from an interviewer.
- **Candidate Scorecard**: The unified 360-degree view consolidating all evidence for hiring decision.
- **Communication Template / Communication Event / Email Log**: Templates, triggers, and delivery records for automated communications.
- **Audit Log**: Immutable record of every significant action with full context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A recruiter can create, configure, and publish a complete recruitment drive (job, eligibility, assessment, proctoring, interviews, communications) in under 30 minutes.
- **SC-002**: A candidate can receive an invitation, verify identity, complete system checks, and begin an assessment in under 3 minutes without creating a permanent account.
- **SC-003**: The platform supports 5,000 concurrent candidates taking assessments within a single drive without service degradation or data loss.
- **SC-004**: All proctoring events are captured and displayed on the recruiter dashboard within 5 seconds of occurrence.
- **SC-005**: 95% of candidates who experience a network disconnection can successfully resume their session with all prior answers intact.
- **SC-006**: AI question generation produces a validated pool of questions within 2 minutes of a recruiter's generation request.
- **SC-007**: 100% of important actions (drive configuration changes, candidate state transitions, proctoring decisions) have corresponding audit log entries.
- **SC-008**: Zero cross-tenant data leakage as verified by tenant isolation tests.
- **SC-009**: Assessment auto-scoring for objective questions completes within 10 seconds of candidate submission.
- **SC-010**: The recruitment funnel (from invitation to final selection) can be completed entirely within the platform without requiring external tools (spreadsheets, separate email, separate proctoring).
- **SC-011**: 90% of recruiters can successfully operate the platform without engineering or technical support.

## Assumptions

- **Target users**: Mid-sized to large IT/software companies (100–5,000 employees) running recurring technical recruitment drives with 100+ candidates per drive.
- **Primary assessment channel**: Desktop/laptop web browser is the primary candidate assessment channel. Mobile support is limited to notifications and registration in V1.
- **AI model access**: The platform has access to LLM APIs (for question generation, interview suggestions, summaries), computer vision models (for face/phone detection), and speech processing capabilities.
- **Infrastructure**: The platform deploys on cloud infrastructure with PostgreSQL, Redis, and object storage (S3/Azure Blob) available. Docker-based deployment.
- **Architecture**: The system starts as a modular monolith (FastAPI backend with clear module boundaries) rather than microservices, with services extracted only when scale demands.
- **Tech stack**: Backend: Python/FastAPI with PostgreSQL, Redis, and pgvector. Frontend: Next.js/TypeScript with Tailwind CSS and WebSocket support. AI: LLM APIs, MediaPipe/YOLO for CV, Whisper for audio.
- **Email provider**: An external email provider (SendGrid, SES, or similar) is available for transactional email delivery.
- **Code execution**: A sandboxed code execution environment is available supporting Python, JavaScript/TypeScript, Java, C++, and SQL for coding and database question evaluation.
- **Enterprise features deferred**: SSO/SAML/SCIM, custom domains, white-label, ATS/HRIS integrations, webhooks, and advanced analytics are not in V1 scope.
- **Proctoring scope (V1)**: V1 proctoring covers face detection, multiple face detection, phone detection, tab switching, fullscreen exit, camera disconnect, and microphone disconnect. Advanced gaze analysis, voice stress analysis, and emotion detection are deferred.
- **Question types (V1)**: V1 supports MCQ (single/multiple correct), true/false, coding, SQL, and short answer. Interactive formats (memory test, pattern recognition, drag-and-drop) are deferred.
