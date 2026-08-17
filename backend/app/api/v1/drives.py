import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_roles
from app.models.organization import User
from app.models.drive import RecruitmentDrive, DriveStage
from app.models.assessment import Assessment
from app.models.candidate import Candidate, Application
from app.models.attempt import AssessmentAttempt
from app.models.proctoring import ProctorSession, ProctorEvent
from app.services.audit_service import AuditService

router = APIRouter(prefix="/drives", tags=["Recruitment Drives"])

class QuestionItem(BaseModel):
    id: Optional[str] = None
    title: str
    question_type: str = "single_mcq" # single_mcq, coding
    options: Optional[List[str]] = []
    correct_answer: Any
    marks: float = 1.0
    boilerplate: Optional[str] = None
    test_cases: Optional[List[Dict[str, Any]]] = []

class DriveCreateRequest(BaseModel):
    title: str
    job_title: str
    job_description: str
    cutoff_percentage: float = 60.0
    send_rejection_emails: bool = False
    duration_minutes: float = 45.0
    onboarding_fields: Optional[List[str]] = ["experience_years", "referral_source", "phone"]
    questions: Optional[List[QuestionItem]] = []

class DriveResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    title: str
    job_title: str
    job_description: str
    status: str
    cutoff_percentage: float = 60.0
    send_rejection_emails: bool = False
    magic_link: str
    qr_code_url: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[Dict[str, Any]])
async def list_drives(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.tenant_id == current_user.tenant_id).order_by(desc(RecruitmentDrive.created_at))
    result = await db.execute(stmt)
    drives = result.scalars().all()
    
    output = []
    for d in drives:
        # Count candidates by status
        app_stmt = select(Application).where(Application.drive_id == d.id)
        app_res = await db.execute(app_stmt)
        apps = app_res.scalars().all()
        
        output.append({
            "id": str(d.id),
            "title": d.title,
            "job_title": d.job_title,
            "job_description": d.job_description,
            "status": d.status,
            "cutoff_percentage": d.eligibility_rules.get("cutoff_percentage", 60.0),
            "send_rejection_emails": d.eligibility_rules.get("send_rejection_emails", False),
            "magic_link": f"/drive/{d.id}/apply",
            "qr_code_url": f"/api/v1/drives/{d.id}/qrcode",
            "total_candidates": len(apps),
            "l1_pool_count": len([a for a in apps if a.status in ["l1_eligible", "l1_in_progress"]]),
            "l2_pool_count": len([a for a in apps if a.status in ["l2_eligible", "l2_in_progress"]]),
            "selected_count": len([a for a in apps if a.status in ["selected", "l2_cleared"]]),
            "rejected_count": len([a for a in apps if a.status in ["test_rejected", "l1_rejected", "l2_rejected"]]),
        })
    return output

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_drive(
    req: DriveCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    drive = RecruitmentDrive(
        tenant_id=current_user.tenant_id,
        title=req.title,
        job_title=req.job_title,
        job_description=req.job_description,
        eligibility_rules={
            "cutoff_percentage": req.cutoff_percentage,
            "send_rejection_emails": req.send_rejection_emails,
            "onboarding_fields": req.onboarding_fields
        },
        proctoring_config={
            "fullscreen": True,
            "tab_switch_detection": True,
            "mobile_visibility_check": True
        },
        created_by=current_user.id,
        status="published" # Published immediately with shareable Magic Link & QR
    )
    db.add(drive)
    await db.flush()

    # Create Assessment Paper with Questions
    question_payload = []
    if req.questions:
        for q in req.questions:
            qd = q.model_dump()
            if not qd.get("id"):
                qd["id"] = str(uuid.uuid4())
            question_payload.append(qd)
    else:
        question_payload = [
            {
                "id": str(uuid.uuid4()),
                "title": "What is the time complexity of searching in a balanced binary search tree?",
                "question_type": "single_mcq",
                "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                "correct_answer": "O(log n)",
                "marks": 5.0
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Write a function `solution(s)` that returns the reverse of string `s`.",
                "question_type": "coding",
                "boilerplate": "def solution(s):\n    pass",
                "test_cases": [{"input": "autergo", "expected_output": "ogretua"}],
                "correct_answer": "return s[::-1]",
                "marks": 10.0
            }
        ]

    assessment = Assessment(
        drive_id=drive.id,
        title=f"{req.title} - Assessment Paper",
        duration_minutes=req.duration_minutes,
        sections=[{"name": "Technical & Coding", "questions": question_payload}],
        paper_versions={"A": question_payload}
    )
    db.add(assessment)

    # Add default stages
    stages = [
        DriveStage(drive_id=drive.id, stage_type="registration", sequence_order=1),
        DriveStage(drive_id=drive.id, stage_type="assessment", sequence_order=2),
        DriveStage(drive_id=drive.id, stage_type="technical_l1", sequence_order=3),
        DriveStage(drive_id=drive.id, stage_type="technical_l2", sequence_order=4),
        DriveStage(drive_id=drive.id, stage_type="final_selection", sequence_order=5),
    ]
    db.add_all(stages)
    await db.commit()
    await db.refresh(drive)

    await AuditService.log_action(
        db=db,
        tenant_id=current_user.tenant_id,
        action="DRIVE_CREATED_AND_PUBLISHED",
        resource_type="recruitment_drives",
        resource_id=drive.id,
        actor_type="user",
        actor_id=current_user.id,
        new_value={"title": drive.title, "cutoff": req.cutoff_percentage}
    )

    return {
        "id": str(drive.id),
        "title": drive.title,
        "job_title": drive.job_title,
        "status": drive.status,
        "cutoff_percentage": req.cutoff_percentage,
        "magic_link": f"/drive/{drive.id}/apply",
        "qr_code_url": f"/api/v1/drives/{drive.id}/qrcode"
    }

@router.get("/{drive_id}/share")
async def get_drive_share_info(
    drive_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id)
    result = await db.execute(stmt)
    drive = result.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    # Use FRONTEND_URL env var if available, otherwise fall back to relative path
    import os
    frontend_url = os.environ.get("FRONTEND_URL", "https://autergo-recruitement-platform.vercel.app")

    return {
        "drive_id": str(drive.id),
        "title": drive.title,
        "job_title": drive.job_title,
        "magic_link": f"/drive/{drive.id}/apply",
        "qr_code_url": f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={frontend_url}/drive/{drive.id}/apply"
    }

@router.get("/{drive_id}")
async def get_drive(
    drive_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id, RecruitmentDrive.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    drive = res.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    app_stmt = select(Application).where(Application.drive_id == drive.id)
    app_res = await db.execute(app_stmt)
    apps = app_res.scalars().all()

    return {
        "id": str(drive.id),
        "title": drive.title,
        "job_title": drive.job_title,
        "job_description": drive.job_description,
        "status": drive.status,
        "cutoff_percentage": drive.eligibility_rules.get("cutoff_percentage", 60.0),
        "send_rejection_emails": drive.eligibility_rules.get("send_rejection_emails", False),
        "total_candidates": len(apps),
        "l1_pool_count": len([a for a in apps if a.status in ["l1_eligible", "l1_in_progress"]]),
        "l2_pool_count": len([a for a in apps if a.status in ["l2_eligible", "l2_in_progress"]]),
        "selected_count": len([a for a in apps if a.status in ["selected", "l2_cleared"]]),
        "rejected_count": len([a for a in apps if a.status in ["test_rejected", "l1_rejected", "l2_rejected"]]),
    }

@router.get("/{drive_id}/candidates")
async def list_drive_candidates(
    drive_id: uuid.UUID,
    stage: Optional[str] = Query("ALL"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    stmt = select(Application).where(Application.drive_id == drive_id).order_by(desc(Application.applied_at))
    result = await db.execute(stmt)
    applications = result.scalars().all()

    output = []
    for app in applications:
        # Filter by stage
        if stage != "ALL":
            if stage == "L1_POOL" and app.status not in ["l1_eligible", "l1_in_progress"]:
                continue
            if stage == "L2_POOL" and app.status not in ["l2_eligible", "l2_in_progress"]:
                continue
            if stage == "SELECTED" and app.status not in ["selected", "l2_cleared"]:
                continue
            if stage == "REJECTED" and app.status not in ["test_rejected", "l1_rejected", "l2_rejected"]:
                continue

        cand_stmt = select(Candidate).where(Candidate.id == app.candidate_id)
        cand_res = await db.execute(cand_stmt)
        cand = cand_res.scalar_one_or_none()

        # Retrieve proctoring telemetry details
        proc_events_count = 0
        att_stmt = select(AssessmentAttempt).where(AssessmentAttempt.application_id == app.id)
        att_res = await db.execute(att_stmt)
        attempt = att_res.scalar_one_or_none()
        
        proc_events_list = []
        if attempt:
            proc_stmt = select(ProctorSession).where(ProctorSession.attempt_id == attempt.id)
            proc_res = await db.execute(proc_stmt)
            proc_session = proc_res.scalar_one_or_none()
            if proc_session:
                events_stmt = select(ProctorEvent).where(ProctorEvent.session_id == proc_session.id)
                events_res = await db.execute(events_stmt)
                events = events_res.scalars().all()
                proc_events_count = len(events)
                proc_events_list = [
                    {
                        "event_type": ev.event_type,
                        "created_at": ev.timestamp.isoformat() if ev.timestamp else None,
                        "metadata": ev.event_metadata
                    }
                    for ev in events
                ]

        output.append({
            "application_id": str(app.id),
            "candidate_id": str(cand.id) if cand else None,
            "full_name": cand.full_name if cand else "Candidate",
            "email": cand.email if cand else "",
            "phone": cand.phone if cand else "",
            "status": app.status,
            "profile_info": app.custom_field_values,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "proctoring_violations_count": proc_events_count,
            "proctoring_violations": proc_events_list
        })
    return output

@router.delete("/{drive_id}")
async def delete_drive(
    drive_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id, RecruitmentDrive.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    drive = res.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    await db.delete(drive)
    await db.commit()
    return {"status": "deleted", "drive_id": str(drive_id)}

class UpdateCutoffRequest(BaseModel):
    cutoff_percentage: float

@router.patch("/{drive_id}/cutoff")
async def update_drive_cutoff(
    drive_id: uuid.UUID,
    req: UpdateCutoffRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id, RecruitmentDrive.tenant_id == current_user.tenant_id)
    res = await db.execute(stmt)
    drive = res.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    new_cutoff = float(req.cutoff_percentage)
    current_rules = dict(drive.eligibility_rules or {})
    current_rules["cutoff_percentage"] = new_cutoff
    drive.eligibility_rules = current_rules

    # Recalculate candidates eligibility for this drive who have already taken the test
    apps_stmt = select(Application).where(Application.drive_id == drive_id)
    apps_res = await db.execute(apps_stmt)
    apps = apps_res.scalars().all()

    updated_candidates = 0
    for app in apps:
        meta = dict(app.custom_field_values or {})
        test_percentage = meta.get("test_percentage")
        if test_percentage is not None:
            # Only re-route candidates whose stages are test-evaluated (test_rejected or l1_eligible)
            if app.status in ["test_rejected", "l1_eligible"]:
                if float(test_percentage) >= new_cutoff:
                    app.status = "l1_eligible"
                    meta.pop("rejection_stage", None)
                    meta.pop("rejection_reason", None)
                else:
                    app.status = "test_rejected"
                    meta["rejection_stage"] = "Online Test"
                    meta["rejection_reason"] = f"Scored {float(test_percentage):.1f}% (Required cutoff: {new_cutoff:.1f}%)"
                app.custom_field_values = meta
                updated_candidates += 1

    await db.commit()
    await db.refresh(drive)

    return {
        "status": "updated",
        "drive_id": str(drive.id),
        "cutoff_percentage": new_cutoff,
        "recalculated_candidates": updated_candidates
    }

class CandidateImportItem(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    experience_years: Optional[float] = 0.0
    referral_source: Optional[str] = "Excel Import"

class BulkImportRequest(BaseModel):
    candidates: List[CandidateImportItem]

@router.post("/{drive_id}/import-whitelist")
async def import_candidates_whitelist(
    drive_id: uuid.UUID,
    req: BulkImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    stmt = select(RecruitmentDrive).where(RecruitmentDrive.id == drive_id)
    res = await db.execute(stmt)
    drive = res.scalar_one_or_none()
    if not drive:
        raise HTTPException(status_code=404, detail="Drive not found")

    imported_count = 0
    for item in req.candidates:
        cand_email = item.email.strip().lower()
        if not cand_email:
            continue

        # Find or create candidate
        cand_stmt = select(Candidate).where(Candidate.email == cand_email, Candidate.tenant_id == drive.tenant_id)
        cand_res = await db.execute(cand_stmt)
        cand = cand_res.scalar_one_or_none()
        if not cand:
            cand = Candidate(
                tenant_id=drive.tenant_id,
                email=cand_email,
                full_name=item.full_name,
                phone=item.phone
            )
            db.add(cand)
            await db.flush()

        # Check existing application
        app_stmt = select(Application).where(Application.drive_id == drive.id, Application.candidate_id == cand.id)
        app_res = await db.execute(app_stmt)
        app = app_res.scalar_one_or_none()

        profile_data = {
            "full_name": item.full_name,
            "email": cand_email,
            "phone": item.phone,
            "experience_years": item.experience_years,
            "referral_source": item.referral_source,
            "is_whitelisted": True
        }

        if not app:
            app = Application(
                tenant_id=drive.tenant_id,
                drive_id=drive.id,
                candidate_id=cand.id,
                status="whitelisted",
                invitation_token=f"tok_{uuid.uuid4().hex[:12]}",
                custom_field_values=profile_data
            )
            db.add(app)
        else:
            current_vals = dict(app.custom_field_values or {})
            current_vals.update(profile_data)
            app.custom_field_values = current_vals

        imported_count += 1

    await db.commit()
    return {"status": "success", "imported_candidates": imported_count}

@router.post("/{drive_id}/candidates/{application_id}/reactivate")
async def reactivate_candidate_attempt(
    drive_id: uuid.UUID,
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["org_admin", "recruitment_manager", "recruiter", "admin"]))
):
    stmt = select(Application).where(Application.id == application_id, Application.drive_id == drive_id)
    res = await db.execute(stmt)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Candidate application not found")

    app.status = "whitelisted"
    meta = dict(app.custom_field_values or {})
    meta["attempt_locked"] = False
    meta["reactivated_by"] = current_user.full_name
    meta["reactivated_at"] = str(uuid.uuid4())
    app.custom_field_values = meta
    await db.commit()

    return {"status": "reactivated", "application_id": str(app.id)}
