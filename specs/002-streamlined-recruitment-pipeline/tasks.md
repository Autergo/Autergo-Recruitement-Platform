# Tasks: Unified Dashboard, Excel Whitelist, Geolocation Anti-Cheat & Candidate Attempt Lifecycle

**Input**: Design documents from `specs/002-streamlined-recruitment-pipeline/` (v2.2.0)  
**Status**: Completed & Verified  

---

## Phase 1: Setup & RBAC Enhancements
- [x] T001 [P] Ensure database models support candidate whitelist flag, live geolocation coordinates, single-attempt lock state, and interview scheduling slots in `backend/app/models/`
- [x] T002 [P] Implement fast Name-Based Authentication endpoint for L1 & L2 interviewers and interviewer list endpoint in `backend/app/api/v1/auth.py`
- [x] T003 Build Dual-Mode Login Screen (Email/Password for Admin/Recruiter + Name Quick-Access for Interviewers) in `frontend/src/app/login/page.tsx`

---

## Phase 2: Excel / CSV Whitelist Ingestion & Auto-Fill
- [x] T004 [P] Implement Excel (`.xlsx`, `.xls`) and CSV file upload & parsing endpoint for drive whitelisting in `backend/app/api/v1/drives.py`
- [x] T005 Implement candidate whitelist verification and instant profile auto-fill endpoint in `backend/app/api/v1/public.py`
- [x] T006 Build Excel/CSV Whitelist Upload modal component with preview table in `frontend/src/components/drives/excel-whitelist-modal.tsx`
- [x] T007 Update Candidate Registration page to verify email against whitelist, auto-fill profile details, and capture live GPS geolocation in `frontend/src/app/(candidate)/drive/[id]/apply/page.tsx`

---

## Phase 3: Single-Attempt Lock, Live Geolocation & Recruiter Unlock
- [x] T008 Implement strict single-attempt lock check on test registration and logger for live GPS geolocation coordinates in `backend/app/api/v1/public.py`
- [x] T009 Implement Recruiter "Reactivate Candidate Attempt" endpoint in `backend/app/api/v1/drives.py`
- [x] T010 Update Candidate 360 Tracking Drawer to display live GPS map coordinates and add the "Reactivate Candidate Attempt" button in `frontend/src/app/(recruiter)/drives/[id]/pipeline/page.tsx`

---

## Phase 4: Manual & Bulk Interview Scheduling
- [x] T011 [P] Implement Manual Single Candidate and Bulk Batch Interview Scheduling endpoints in `backend/app/api/v1/interviews.py`
- [x] T012 Build Manual & Bulk Interview Scheduling Modal in `frontend/src/components/interviews/schedule-modal.tsx`

---

## Phase 5: Unified Dashboard Workspace (`/dashboard`)
- [x] T013 Implement System Health and Admin Role management endpoints in `backend/app/api/v1/organization.py`
- [x] T014 Build Consolidated Unified Dashboard (`/dashboard`) with dynamic tabs for Recruiter Drives & Pipeline, L1 Pool, L2 Pool, and Admin System Health in `frontend/src/app/(recruiter)/dashboard/page.tsx`

---

## Phase 6: Polish & Verification
- [x] T015 Update seed script with sample Excel candidate roster and L1/L2 test attempts in `backend/scripts/seed_demo_data.py`
- [x] T016 Run automated tests and verify frontend production build
