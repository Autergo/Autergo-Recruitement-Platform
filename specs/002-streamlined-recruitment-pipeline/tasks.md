# Tasks: Streamlined 4-Actor Recruitment Platform

**Input**: Design documents from `specs/002-streamlined-recruitment-pipeline/`  
**Status**: Completed (`30/30 Tasks Complete`)

---

## Phase 1: Setup & Foundational
- [X] T001 [P] Ensure SQLite/Postgres async database schemas and migrations support custom onboarding and proctoring fields in `backend/app/models/`
- [X] T002 [P] Configure RBAC authentication dependency guards for `admin`, `recruiter`, `l1_interviewer`, and `l2_interviewer` in `backend/app/api/v1/auth.py`
- [X] T003 Setup modern navigation bar and role-adaptive dashboard layout in `frontend/src/app/(recruiter)/layout.tsx`

---

## Phase 2: User Story 1 — Recruiter Drive Creation & Magic Link / QR Code Generation (P1) 🎯
- [X] T004 [US1] Implement Drive creation endpoint supporting question papers with answer keys, cutoff %, and rejection email toggles in `backend/app/api/v1/drives.py`
- [X] T005 [US1] Implement Drive Magic Link (`/drive/{id}/apply`) and QR code generation endpoint in `backend/app/api/v1/drives.py`
- [X] T006 [P] [US1] Build Recruiter Drive Creation UI with question & answer editor in `frontend/src/app/(recruiter)/drives/create/page.tsx`
- [X] T007 [P] [US1] Build Drive Share Modal displaying the Magic Link and scannable QR Code in `frontend/src/app/(recruiter)/dashboard/page.tsx`

---

## Phase 3: User Story 2 — Candidate Onboarding, Dual-Device Proctoring & Timed Test (P1) 🎯
- [X] T008 [US2] Implement public drive info and candidate registration endpoint in `backend/app/api/v1/public.py`
- [X] T009 [US2] Implement candidate answer submission and automated cutoff grading (`L1_ELIGIBLE` vs `TEST_REJECTED`) in `backend/app/api/v1/public.py`
- [X] T010 [US2] Implement tab-switch and fullscreen-blur telemetry logging endpoint in `backend/app/api/v1/public.py`
- [X] T011 [P] [US2] Build Candidate Public Registration & Onboarding Info page in `frontend/src/app/(candidate)/drive/[id]/apply/page.tsx`
- [X] T012 [P] [US2] Build Proctoring Warning & Consent modal with device detection (Laptop / Mobile) in `frontend/src/app/(candidate)/drive/[id]/apply/page.tsx`
- [X] T013 [US2] Build Responsive Candidate Assessment Runner with fullscreen enforcement, tab-switch listeners, and live auto-save in `frontend/src/app/(candidate)/test/[token]/take/page.tsx`

---

## Phase 4: User Story 3 — L1 Technical Interviewer Pool & Evaluation (P1) 🎯
- [X] T014 [US3] Implement L1 candidate pool listing, claim lock, and release endpoints in `backend/app/api/v1/interviews.py`
- [X] T015 [US3] Implement L1 candidate dossier endpoint (profile + submitted test paper with answer keys) in `backend/app/api/v1/interviews.py`
- [X] T016 [US3] Implement L1 feedback submission endpoint (`PASS` $\implies$ `L2_ELIGIBLE`, `REJECT` $\implies$ `L1_REJECTED`) in `backend/app/api/v1/interviews.py`
- [X] T017 [P] [US3] Build L1 Interviewer Pool Dashboard with Claim / Release buttons in `frontend/src/app/(interviewer)/l1/page.tsx`
- [X] T018 [P] [US3] Build L1 Candidate Evaluation Dossier with test paper review and feedback form in `frontend/src/app/(interviewer)/l1/[id]/dossier/page.tsx`

---

## Phase 5: User Story 4 — L2 Advanced/Panel Interviewer Pool & Evaluation (P1) 🎯
- [X] T019 [US4] Implement L2 candidate pool listing, claim lock, and release endpoints in `backend/app/api/v1/interviews.py`
- [X] T020 [US4] Implement L2 candidate dossier endpoint (profile + test paper + **L1 notes & rating**) in `backend/app/api/v1/interviews.py`
- [X] T021 [US4] Implement L2 feedback submission endpoint (`PASS` $\implies$ `L2_CLEARED`, `REJECT` $\implies$ `L2_REJECTED`) in `backend/app/api/v1/interviews.py`
- [X] T022 [P] [US4] Build L2 Interviewer Pool Dashboard with Claim / Release buttons in `frontend/src/app/(interviewer)/l2/page.tsx`
- [X] T023 [P] [US4] Build L2 Candidate Evaluation Dossier displaying L1 notes and L2 rubric form in `frontend/src/app/(interviewer)/l2/[id]/dossier/page.tsx`

---

## Phase 6: User Story 5 — Recruiter 360 Tracking & Candidate Dossier (P1) 🎯
- [X] T024 [US5] Implement Recruiter Candidate Pipeline query endpoint with stage filters (`ALL`, `TEST_PENDING`, `L1_POOL`, `L2_POOL`, `SELECTED`, `REJECTED`) in `backend/app/api/v1/drives.py`
- [X] T025 [US5] Implement Candidate 360 full audit trail endpoint in `backend/app/api/v1/drives.py`
- [X] T026 [P] [US5] Build Recruiter Pipeline Tracking Board with real-time stage badges in `frontend/src/app/(recruiter)/drives/[id]/pipeline/page.tsx`
- [X] T027 [P] [US5] Build Candidate 360 Slide-Over Drawer displaying complete score, proctoring flags, L1/L2 feedback, and rejection reasons in `frontend/src/app/(recruiter)/drives/[id]/pipeline/page.tsx`

---

## Phase 7: Polish, Verification & Seeding
- [X] T028 Update demo seeding script with sample L1/L2 eligible candidates in `backend/scripts/seed_demo_data.py`
- [X] T029 Write integration tests covering the full pipeline in `backend/tests/integration/test_streamlined_pipeline.py`
- [X] T030 Update master change tracker in `CHANGELOG_TRACKER.md`
