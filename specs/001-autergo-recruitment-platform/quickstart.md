# Quickstart & Verification Guide: Autergo Recruitment Platform

**Feature**: `001-autergo-recruitment-platform`  
**Date**: 2026-08-14  

This guide provides the exact test scenarios and verification steps to validate the Autergo Enterprise Recruitment Platform end-to-end.

---

## 1. Prerequisites & Environment Setup

### Required Infrastructure
- **Python**: 3.11+ with `uv` or `pip`
- **Node.js**: v18+ with `npm`
- **PostgreSQL**: 16+ with `pgvector` extension enabled
- **Redis**: 7+
- **Docker**: For running sandboxed multi-language test runners

### Quick Spin-up (Docker Compose)
```bash
# 1. Start backing services (PostgreSQL, Redis, MinIO)
docker compose up -d postgres redis minio

# 2. Setup backend environment and run migrations
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
alembic upgrade head

# 3. Seed demo organization & admin user
python scripts/seed_demo_data.py

# 4. Start backend API & workers
uvicorn app.main:app --reload --port 8000 &
celery -A app.core.celery worker --loglevel=info &

# 5. Start frontend app
cd ../frontend
npm install
npm run dev
```

---

## 2. End-to-End Validation Scenarios

### Scenario 1: Recruiter Drive Setup & Publishing
1. Navigate to `http://localhost:3000/login` and log in as `admin@autergo.com` / `password123`.
2. Click **Create Recruitment Drive** to launch the 8-step wizard:
   - **Job**: Title "AI Engineer Campus 2026", Skills "Python, SQL, DSA".
   - **Eligibility**: Min CGPA 7.0, Degree "B.Tech/BE Computer Science".
   - **Assessment**: Add Section "Python & Data Structures" (10 MCQs + 1 Coding Question).
   - **Proctoring**: Enable Camera, Phone Detection, Tab Switching. Set High Risk threshold to 70.
   - **Communications**: Set invite and shortlist email templates.
3. Click **Publish Drive**.
4. **Verification**: Drive status becomes `PUBLISHED`. An invitation link and unique QR code are generated.

---

### Scenario 2: Candidate Zero-Account Onboarding & Timed Assessment
1. Open an incognito browser window and navigate to the generated invitation URL `http://localhost:3000/invite/{token}`.
2. Enter email and verify with OTP code `123456`.
3. Complete the interactive **System Readiness Check**:
   - Camera permission granted → Face preview active.
   - Microphone permission granted → Audio waveform responds.
   - Browser full-screen confirmed.
4. Begin the assessment:
   - Answer objective MCQs (incremental auto-save indicator shows green).
   - Switch to the coding question: write a Python solution to reverse a linked list and click **Run Tests** (sandboxed execution returns test assertion results).
5. Disconnect internet / close tab, then reopen within 15 minutes:
   - **Verification**: Session automatically resumes with the countdown timer paused during the gap, and all prior answers preserved intact.
6. Click **Submit Assessment**.
7. **Verification**: Candidate sees immediate confirmation screen; session becomes permanently locked.

---

### Scenario 3: Live Recruiter Command Center & Anomaly Review
1. In the recruiter window, navigate to `http://localhost:3000/drives/{drive_id}/live`.
2. **Verification**: Live WebSocket connection updates metrics in real-time (Active Candidates: 1, Progress: 100%).
3. Simulate a proctoring anomaly (e.g. hold phone up to camera or trigger tab switch):
   - **Verification**: Alert appears on recruiter dashboard under **Suspicious Alerts** within <5 seconds.
4. Click candidate's name to inspect the **Suspicion Timeline**:
   - Review timestamped event entries and click snapshot media clip.
   - Click **Confirm Violation** or **Ignore** — verify decision is logged to audit trail.

---

### Scenario 4: AI-Assisted Interview & Candidate 360 Scorecard
1. In recruiter dashboard, click **Shortlist Candidate**.
2. Assign interview round to an interviewer.
3. Open the **Candidate 360 View**:
   - Inspect combined radar chart (Assessment Score: 92%, Coding: 100%, Proctoring Risk: LOW, Skill Match: 95%).
   - View AI suggested interview questions targeting lower-scoring topics.
4. Submit Interview Evaluation with rubric scores (Problem Solving: 5/5, Tech: 4/5) and select **Strong Hire**.
5. **Verification**: Candidate state transitions to `SELECTED`, and offer communication is queued.

---

## 3. Automated Test Suite Execution

Run automated unit, integration, and contract tests:
```bash
# Run backend pytest suite
cd backend
pytest tests/ -v --cov=app

# Run frontend test suite
cd ../frontend
npm test
```
