# Autergo Recruitment Platform — Business Requirements Document (BRD)

**Document Version**: 1.0.0  
**Status**: Approved & Active  
**Author**: Autergo Product Management & System Architecture  
**Target Audience**: Executive Stakeholders, Engineering, Compliance, Enterprise Recruitment Teams  

---

## 1. Executive Summary

Enterprise hiring teams face a trilemma: recruiting thousands of candidates simultaneously, preventing widespread candidate fraud and generative AI cheating, and evaluating domain competency without burning hundreds of recruiter engineering hours. 

**Autergo Enterprise Recruitment Platform** is an enterprise-grade, zero-friction recruitment operating system built to automate the end-to-end recruitment lifecycle:
1. **Recruitment Drive Orchestration**: 8-step configurable drive creation with customizable candidate schemas and multi-stage pipelines.
2. **Zero-Friction Candidate Experience**: Zero-account magic token + OTP entry, automated device and camera readiness checks, and resilient 15-minute disconnect recovery.
3. **Integrity & Multi-Signal Proctoring**: Client-side edge CV face tracking, environmental anomaly telemetry, and a weighted risk scoring engine paired with human reviewer adjudication.
4. **Sandboxed Code Execution**: Multi-language isolated runners with live test case assertion feedback.
5. **Real-Time Recruiter Command Center**: Sub-5s WebSocket operational dashboard with candidate telemetry streams and remote drive control.
6. **Candidate 360 & AI Assistance**: Unified candidate evaluation dossiers with competency radar charts, gap-focused question generation, and structured rubric scorecards.

---

## 2. Business Objectives & Key Results (OKRs)

| Objective | Key Result | Measurement |
|---|---|---|
| **Dramatically Cut Time-to-Hire** | Reduce candidate evaluation cycle from weeks to <48 hours | Drive lifecycle duration |
| **Eliminate Hiring Assessment Fraud** | Flag 95%+ of impersonation, tab switching, and unauthorized device attempts | Multi-signal risk precision |
| **Zero Candidate Drop-off from Friction** | Achieve <1% drop-off due to authentication or test disconnects | Session recovery completion rate |
| **Save Technical Interview Hours** | Reduce recruiter prep time by 70% with AI-generated rubric questions | Recruiter interview prep time |
| **Enterprise Governance & Compliance** | 100% immutable audit logging for all candidate status transitions | Audit trail completeness |

---

## 3. User Personas & Stakeholder Analysis

### 3.1 Primary Personas
1. **Talent Acquisition Lead / Recruiter (Sarah)**:
   - *Goal*: Launch campaigns for 500+ campus/lateral candidates in minutes, monitor live test completion rates, and shortlist top talent with data-backed scorecards.
   - *Pain Point*: Manual spreadsheet tracking, high assessment drop-offs, inability to verify candidate identity.
2. **Technical Interviewer (Alex)**:
   - *Goal*: Conduct structured 45-minute technical interviews with candidate assessment data and AI-suggested skill gap questions at their fingertips.
   - *Pain Point*: Unstructured evaluations, repetitive questions, missing context on what the candidate solved in the initial round.
3. **Assessment Candidate (Priya)**:
   - *Goal*: Complete a high-stakes coding and aptitude assessment smoothly without tedious portal account creation or losing test progress during network glitches.
   - *Pain Point*: Complicated signup forms, browser crashes wiping written code, rigid anti-cheat tools triggering false bans.
4. **Organization Administrator / Compliance Officer (David)**:
   - *Goal*: Enforce tenant isolation, role-based access control, GDPR/DPDP data protection, and immutable audit logs.
   - *Pain Point*: Leaked assessment papers, lack of audit trails for hiring decisions.

---

## 4. Scope & Feature Matrix

| Feature Domain | In Scope (V1 MVP) | Out of Scope (Future Releases) |
|---|---|---|
| **Campaigns & Drives** | 8-step wizard, custom form fields, eligibility rules, CSV bulk import | Public job board syndication |
| **Assessment & Sandbox** | MCQ, multi-correct, subjective, Python/JS/C++/Java/SQL sandbox | Hardware FPGA emulation |
| **Proctoring & Risk** | Edge CV face detection, tab switch logging, phone detection, human adjudication | Continuous biometric voiceprint analysis |
| **Live Operations** | WebSocket command center, pause/extend/terminate candidate controls | Automated video call recording translation |
| **Interview Engine** | AI-suggested rubric questions, Candidate 360 dossiers, structured scoring | Autonomous AI hiring bot (forbidden by Constitution) |
| **Communications** | Triggered email templates with variable substitution, funnel analytics | WhatsApp / SMS delivery gateways |

---

## 5. Non-Functional Requirements & Governance

1. **Security & Privacy**:
   - Zero hardcoded credentials; all secrets loaded from environment or vault.
   - Role-Based Access Control (Admin, Recruiter, Interviewer).
   - Candidate evidence stored with short-lived presigned URLs.
2. **Reliability & Data Durability**:
   - Incremental answer auto-save on every keystroke/selection.
   - 15-minute disconnect recovery grace period.
3. **Multi-Tier AI Strategy**:
   - Primary: NVIDIA Nemotron 3.5 Lightning (Reasoning enabled).
   - Fallback: Groq Free Tier (Llama 3.3 70B / Gemma 2 9B).
   - Strict Human-in-the-Loop governance: No autonomous disqualification or candidate rejection without recruiter sign-off.
