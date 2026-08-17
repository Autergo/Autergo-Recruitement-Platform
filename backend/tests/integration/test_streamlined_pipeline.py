import pytest
import uuid
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_recruiter_drive_creation_and_magic_link():
    """Verify that recruiter can create drive and get magic link & QR code"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Login as recruiter
        login_res = await ac.post("/api/v1/auth/login", data={"username": "recruiter@autergo.com", "password": "Recruiter@123"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create Drive with questions and cutoff
        drive_payload = {
            "title": "Integration Test Backend Drive",
            "job_title": "Python FastAPI Developer",
            "job_description": "FastAPI and PostgreSQL expert",
            "cutoff_percentage": 50.0,
            "send_rejection_emails": False,
            "duration_minutes": 30.0,
            "questions": [
                {
                    "title": "What is FastAPI built on?",
                    "question_type": "single_mcq",
                    "options": ["Starlette", "Flask", "Django", "Tornado"],
                    "correct_answer": "Starlette",
                    "marks": 10.0
                }
            ]
        }
        res = await ac.post("/api/v1/drives", json=drive_payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert "id" in data
        assert data["magic_link"].startswith("/drive/")
        drive_id = data["id"]

        # 3. Candidate registers via public magic link
        reg_res = await ac.post(f"/api/v1/public/drive/{drive_id}/register", json={
            "email": f"candidate_{uuid.uuid4().hex[:6]}@example.com",
            "full_name": "Integration Candidate",
            "experience_years": 3.0,
            "referral_source": "LinkedIn"
        })
        assert reg_res.status_code == 200
        reg_data = reg_res.json()
        cand_token = reg_data["session_token"]
        assert len(reg_data["questions"]) == 1
        q_id = reg_data["questions"][0]["id"]

        # 4. Candidate submits correct answer (> 50% cutoff)
        cand_headers = {"Authorization": f"Bearer {cand_token}"}
        sub_res = await ac.post("/api/v1/public/assessment/submit", json={
            "answers": {q_id: "Starlette"},
            "device_type": "laptop",
            "proctoring_telemetry": {"tab_switches": 0}
        }, headers=cand_headers)
        assert sub_res.status_code == 200
        sub_data = sub_res.json()
        assert sub_data["is_qualified"] is True
        assert sub_data["status"] == "l1_eligible"
