# Data Model & Schema Design: Autergo Enterprise Recruitment Platform

**Feature**: `001-autergo-recruitment-platform`  
**Date**: 2026-08-14  
**Storage**: PostgreSQL 16 + pgvector + Redis 7  

---

## Entity Relationship Overview

```text
Organization (Tenant)
  │
  ├── Users (RBAC)
  │     └── RefreshTokens
  │
  ├── RecruitmentDrives
  │     ├── Jobs & EligibilityRules
  │     ├── DriveStages (Registration, Assessment, Interview Rounds, Final)
  │     ├── CandidateFormFields (Custom schema fields)
  │     ├── Assessments (Sections, Paper Versions A/B/C/D)
  │     ├── CommunicationTemplates & EventRules
  │     │
  │     └── Applications (Candidate enrollment per drive)
  │           ├── AssessmentAttempts
  │           │     ├── Answers (MCQ, Code, SQL, Subjective)
  │           │     └── ProctorSessions
  │           │           ├── ProctorEvents (Telemetry & Media refs)
  │           │           └── RiskScores (Aggregated suspicion)
  │           │
  │           ├── Interviews
  │           │     └── InterviewEvaluations (Rubrics & Notes)
  │           │
  │           └── CandidateScorecards (Candidate 360 & Final Decisions)
  │
  ├── QuestionBank
  │     ├── Questions (Metadata, Skills, Difficulty, Type)
  │     └── QuestionOptions / TestCases (Coding/SQL tests)
  │
  └── AuditLogs (Immutable action trace)
```

---

## 1. Multi-Tenancy & Access Control

### `organizations`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Unique organization ID |
| `name` | VARCHAR(255) | NOT NULL | Company name |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | URL identifier |
| `settings` | JSONB | NOT NULL, default '{}' | Branding, security policies, data retention |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Update timestamp |

### `users`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | User ID |
| `tenant_id` | UUID | Foreign Key -> organizations(id), NOT NULL | Tenant isolation scope |
| `email` | VARCHAR(255) | NOT NULL | Work email (unique per tenant) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt / Argon2 hash |
| `full_name` | VARCHAR(255) | NOT NULL | Recruiter/Admin full name |
| `role` | VARCHAR(50) | NOT NULL | `org_admin`, `recruitment_manager`, `recruiter`, `hiring_manager`, `interviewer`, `reviewer` |
| `is_active` | BOOLEAN | NOT NULL, default true | Active status flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Creation timestamp |

---

## 2. Recruitment Drives & Custom Fields

### `recruitment_drives`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Drive ID |
| `tenant_id` | UUID | Foreign Key -> organizations(id), NOT NULL | Tenant isolation scope |
| `title` | VARCHAR(255) | NOT NULL | e.g. "AI Engineer Campus Drive 2026" |
| `job_title` | VARCHAR(255) | NOT NULL | Target job title |
| `job_description` | TEXT | NOT NULL | Comprehensive job description |
| `status` | VARCHAR(50) | NOT NULL, default 'draft' | `draft`, `published`, `live`, `paused`, `completed`, `archived` |
| `eligibility_rules` | JSONB | NOT NULL, default '{}' | Degree, minimum CGPA, graduation years, experience |
| `proctoring_config` | JSONB | NOT NULL, default '{}' | Enabled signals, anomaly thresholds, weights |
| `created_by` | UUID | Foreign Key -> users(id) | Author user |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Update timestamp |

### `drive_stages`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Stage ID |
| `drive_id` | UUID | Foreign Key -> recruitment_drives(id), NOT NULL | Associated drive |
| `stage_type` | VARCHAR(50) | NOT NULL | `registration`, `assessment`, `technical_interview`, `manager_interview`, `hr_interview`, `final_decision` |
| `sequence_order` | INT | NOT NULL | Order in recruitment pipeline (1, 2, 3...) |
| `configuration` | JSONB | NOT NULL, default '{}' | Stage-specific rules, cutoff thresholds |

### `candidate_form_fields`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Custom field ID |
| `drive_id` | UUID | Foreign Key -> recruitment_drives(id), NOT NULL | Associated drive |
| `field_name` | VARCHAR(100) | NOT NULL | Technical field key |
| `label` | VARCHAR(255) | NOT NULL | User-facing display label |
| `field_type` | VARCHAR(50) | NOT NULL | `text`, `number`, `dropdown`, `multi_select`, `date`, `file`, `resume`, `checkbox`, `url` |
| `is_required` | BOOLEAN | NOT NULL, default false | Mandatory field flag |
| `validation_rules` | JSONB | NOT NULL, default '{}' | Min, max, regex, allowed options |

---

## 3. Candidates & Applications

### `candidates`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Unique candidate ID |
| `tenant_id` | UUID | Foreign Key -> organizations(id), NOT NULL | Tenant scope |
| `email` | VARCHAR(255) | NOT NULL | Candidate email |
| `full_name` | VARCHAR(255) | NOT NULL | Candidate name |
| `phone` | VARCHAR(50) | NULL | Contact phone number |
| `resume_url` | TEXT | NULL | Encrypted storage path to resume PDF |
| `resume_embedding` | vector(1536) | NULL | pgvector semantic embedding for skill matching |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Creation timestamp |

### `applications`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Application ID |
| `tenant_id` | UUID | Foreign Key -> organizations(id), NOT NULL | Tenant scope |
| `drive_id` | UUID | Foreign Key -> recruitment_drives(id), NOT NULL | Associated drive |
| `candidate_id` | UUID | Foreign Key -> candidates(id), NOT NULL | Candidate reference |
| `status` | VARCHAR(50) | NOT NULL, default 'invited' | State machine status: `invited`, `registered`, `verified`, `ready`, `in_progress`, `submitted`, `under_review`, `shortlisted`, `interview_scheduled`, `interview_completed`, `final_review`, `selected`, `rejected`, `hold` |
| `invitation_token` | VARCHAR(255) | NOT NULL, UNIQUE | Secure bootstrap magic token |
| `custom_field_values` | JSONB | NOT NULL, default '{}' | Key-value pairs for custom form fields |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Enrollment timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Status update timestamp |

---

## 4. Question Bank & Assessment Engine

### `questions`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Question ID |
| `tenant_id` | UUID | Foreign Key -> organizations(id), NOT NULL | Tenant scope |
| `skill` | VARCHAR(100) | NOT NULL | e.g. "Python", "SQL", "DSA", "System Design" |
| `topic` | VARCHAR(100) | NOT NULL | e.g. "Binary Trees", "Joins", "AsyncIO" |
| `difficulty` | VARCHAR(20) | NOT NULL | `easy`, `medium`, `hard` |
| `question_type` | VARCHAR(50) | NOT NULL | `single_mcq`, `multiple_mcq`, `true_false`, `coding`, `sql`, `short_answer` |
| `title` | TEXT | NOT NULL | Question text/prompt |
| `content` | JSONB | NOT NULL | Question body, options, code boilerplate |
| `correct_answer` | JSONB | NOT NULL | Ground truth answer key or rubric |
| `marks` | NUMERIC(5,2) | NOT NULL, default 1.0 | Score weight |
| `negative_marks` | NUMERIC(5,2) | NOT NULL, default 0.0 | Negative deduction weight |
| `expected_time_sec` | INT | NOT NULL, default 60 | Target completion time in seconds |
| `is_ai_generated` | BOOLEAN | NOT NULL, default false | Provenance flag |
| `is_human_verified` | BOOLEAN | NOT NULL, default false | Review verification flag |
| `question_embedding` | vector(1536) | NULL | For similarity and duplicate detection |
| `version` | INT | NOT NULL, default 1 | Version counter |

### `assessments`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Assessment ID |
| `drive_id` | UUID | Foreign Key -> recruitment_drives(id), NOT NULL | Associated drive |
| `title` | VARCHAR(255) | NOT NULL | Assessment title |
| `duration_minutes` | INT | NOT NULL | Total exam duration |
| `pass_percentage` | NUMERIC(5,2) | NOT NULL, default 60.0 | Passing cutoff threshold |
| `sections` | JSONB | NOT NULL | Sections structure (skills, questions, difficulty distribution) |
| `paper_versions` | JSONB | NOT NULL, default '{"A": []}' | Generated paper variants A/B/C/D |

---

## 5. Candidate Assessment Attempts & Hybrid Scoring

### `assessment_attempts`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Attempt ID |
| `application_id` | UUID | Foreign Key -> applications(id), NOT NULL | Application scope |
| `paper_version` | VARCHAR(10) | NOT NULL, default 'A' | Assigned paper version |
| `status` | VARCHAR(50) | NOT NULL, default 'started' | `started`, `in_progress`, `disconnected`, `submitted`, `evaluated` |
| `session_token_hash` | VARCHAR(255) | NOT NULL | Authenticated active session token hash |
| `device_binding_meta` | JSONB | NOT NULL | Browser fingerprint, OS, IP, screen dimensions |
| `started_at` | TIMESTAMPTZ | NOT NULL, default now() | Session start timestamp |
| `submitted_at` | TIMESTAMPTZ | NULL | Final submission timestamp |
| `remaining_seconds` | INT | NOT NULL | Paused timer counter during disconnect |
| `total_score` | NUMERIC(6,2) | NULL | Final calculated score |
| `percentage` | NUMERIC(5,2) | NULL | Calculated overall percentage |
| `section_scores` | JSONB | NOT NULL, default '{}' | Breakdown per section/skill |

### `attempt_answers`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Answer record ID |
| `attempt_id` | UUID | Foreign Key -> assessment_attempts(id), NOT NULL | Associated attempt |
| `question_id` | UUID | Foreign Key -> questions(id), NOT NULL | Question reference |
| `submitted_answer` | JSONB | NOT NULL | Candidate chosen option, code, or essay |
| `is_correct` | BOOLEAN | NULL | Auto-scoring evaluation flag |
| `score_awarded` | NUMERIC(5,2) | NOT NULL, default 0.0 | Awarded marks |
| `code_execution_results` | JSONB | NULL | Test cases passed/failed, execution time, stdout |
| `ai_evaluation_meta` | JSONB | NULL | AI feedback, rubric scores, confidence score |
| `saved_at` | TIMESTAMPTZ | NOT NULL, default now() | Auto-save timestamp |

---

## 6. Proctoring & Risk Engine

### `proctor_sessions`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Proctor session ID |
| `attempt_id` | UUID | Foreign Key -> assessment_attempts(id), NOT NULL | Associated attempt |
| `risk_score` | NUMERIC(5,2) | NOT NULL, default 0.0 | Aggregated suspicion score (0–100) |
| `risk_level` | VARCHAR(20) | NOT NULL, default 'NORMAL' | `NORMAL` (0-30), `WATCH` (31-60), `SUSPICIOUS` (61-80), `CRITICAL` (81-100) |
| `adjudication_status` | VARCHAR(50) | NOT NULL, default 'pending' | `pending`, `confirmed_violation`, `ignored`, `flagged_for_review` |
| `adjudicated_by` | UUID | Foreign Key -> users(id) | Reviewer user ID |
| `adjudication_notes` | TEXT | NULL | Human reviewer justification |

### `proctor_events`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Event ID |
| `session_id` | UUID | Foreign Key -> proctor_sessions(id), NOT NULL | Associated proctor session |
| `event_type` | VARCHAR(50) | NOT NULL | `FACE_ABSENT`, `MULTIPLE_FACES`, `PHONE_DETECTED`, `TAB_SWITCHED`, `FULLSCREEN_EXIT`, `AUDIO_VOICE_DETECTED`, `CAMERA_DISCONNECTED` |
| `confidence` | NUMERIC(4,2) | NOT NULL | AI model detection confidence (0.00 - 1.00) |
| `severity` | VARCHAR(20) | NOT NULL | `low`, `medium`, `high`, `critical` |
| `risk_weight` | NUMERIC(5,2) | NOT NULL | Contribution points to composite risk score |
| `evidence_media_url` | TEXT | NULL | Signed URL to snapshot JPEG or short WebM clip |
| `model_version` | VARCHAR(50) | NOT NULL | e.g. "mediapipe-face-v2.1", "yolo-phone-v8.4" |
| `timestamp` | TIMESTAMPTZ | NOT NULL, default now() | Event occurrence timestamp |

---

## 7. Interview Engine & Candidate 360

### `interviews`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Interview ID |
| `application_id` | UUID | Foreign Key -> applications(id), NOT NULL | Application scope |
| `stage_id` | UUID | Foreign Key -> drive_stages(id), NOT NULL | Round stage reference |
| `interview_mode` | VARCHAR(50) | NOT NULL | `human`, `technical`, `coding`, `panel`, `ai_assisted`, `hr` |
| `scheduled_start` | TIMESTAMPTZ | NOT NULL | Scheduled start time |
| `scheduled_end` | TIMESTAMPTZ | NOT NULL | Scheduled end time |
| `meeting_link` | TEXT | NULL | Video call link |
| `status` | VARCHAR(50) | NOT NULL, default 'scheduled' | `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show` |

### `interview_evaluations`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Evaluation ID |
| `interview_id` | UUID | Foreign Key -> interviews(id), NOT NULL | Associated interview |
| `interviewer_id` | UUID | Foreign Key -> users(id), NOT NULL | Reviewer user |
| `rubric_ratings` | JSONB | NOT NULL | Scores 1-5 for technical, problem solving, communication, culture |
| `comments` | TEXT | NOT NULL | Interviewer qualitative feedback |
| `ai_suggested_questions` | JSONB | NULL | AI targeted questions based on candidate score gaps |
| `ai_summary` | TEXT | NULL | Grounded AI summary of transcript and evaluation |
| `recommendation` | VARCHAR(50) | NOT NULL | `strong_hire`, `hire`, `hold`, `reject` |
| `submitted_at` | TIMESTAMPTZ | NOT NULL, default now() | Evaluation submission timestamp |

### `candidate_scorecards`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Scorecard ID |
| `application_id` | UUID | Foreign Key -> applications(id), NOT NULL, UNIQUE | One-to-one with application |
| `skill_matrix` | JSONB | NOT NULL | Composite ratings per competency |
| `role_match_percentage` | NUMERIC(5,2) | NOT NULL | Computed role alignment score |
| `final_decision` | VARCHAR(50) | NOT NULL, default 'pending' | `pending`, `strong_hire`, `hire`, `hold`, `reject` |
| `decided_by` | UUID | Foreign Key -> users(id) | Hiring Manager / Admin user |
| `decision_notes` | TEXT | NULL | Justification remarks |
| `decided_at` | TIMESTAMPTZ | NULL | Timestamp of final decision |

---

## 8. Communications & Audit Logs

### `communication_templates`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Template ID |
| `tenant_id` | UUID | Foreign Key -> organizations(id), NOT NULL | Tenant scope |
| `name` | VARCHAR(100) | NOT NULL | Template label |
| `trigger_event` | VARCHAR(50) | NOT NULL | e.g. `CANDIDATE_REGISTERED`, `ASSESSMENT_INVITED`, `SHORTLISTED` |
| `subject_template` | TEXT | NOT NULL | Subject with mustache tokens `{{candidate.name}}` |
| `body_template` | TEXT | NOT NULL | HTML body with variables |

### `audit_logs`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key, default gen_random_uuid() | Audit entry ID |
| `tenant_id` | UUID | Foreign Key -> organizations(id), NOT NULL | Tenant scope |
| `actor_id` | UUID | NULL | User ID or NULL for system actions |
| `actor_type` | VARCHAR(50) | NOT NULL | `user`, `candidate`, `system` |
| `action` | VARCHAR(100) | NOT NULL | e.g. `DRIVE_UPDATED`, `SCORE_OVERRIDDEN`, `PROCTOR_ADJUDICATED` |
| `resource_type` | VARCHAR(50) | NOT NULL | Entity table name |
| `resource_id` | UUID | NOT NULL | Entity primary key |
| `old_value` | JSONB | NULL | Pre-mutation state |
| `new_value` | JSONB | NULL | Post-mutation state |
| `ip_address` | VARCHAR(45) | NULL | Client IP |
| `user_agent` | TEXT | NULL | Client user agent |
| `timestamp` | TIMESTAMPTZ | NOT NULL, default now() | Immutable occurrence timestamp |
