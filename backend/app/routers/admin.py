"""Admin router — full governance endpoints."""

from datetime import datetime, timezone
from typing import Optional
import asyncio

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Query,
    BackgroundTasks,
    status,
    Request,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update

from app.database import get_db
from app.middleware.rbac import require_role, CurrentUser
from app.middleware.audit import write_audit_log
from app.models.user import User
from app.models.student import Student, StaffStudent
from app.models.staff_profile import StaffProfile
from app.models.department import Department
from app.models.prediction import Prediction
from app.models.audit_log import AuditLog
from app.models.settings import ModelRegistry as ModelRegistryDB, SystemSettings
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.services.user_service import (
    list_users,
    create_user,
    update_user,
    toggle_user_active,
    reset_user_password,
    soft_delete_user,
)
from app.services.upload_service import bulk_upload_students, bulk_upload_staff
from app.services.prediction_service import run_prediction_for_student, get_system_settings
from app.ml.engine import get_engine
import pandas as pd

router = APIRouter(prefix="/admin", tags=["admin"])
AdminUser = Depends(require_role("admin"))


@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    total_students = await db.execute(select(func.count(Student.id)))
    total_staff = await db.execute(select(func.count(StaffProfile.id)))
    total_depts = await db.execute(select(func.count(Department.id)))

    # Risk distribution from latest predictions
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}

    students_result = await db.execute(select(Student.id))
    student_ids = [r[0] for r in students_result.all()]

    high_risk_count = 0
    top_risk_students = []
    gpa_values = []

    for sid in student_ids:
        pred_result = await db.execute(
            select(Prediction)
            .where(Prediction.student_id == sid)
            .order_by(desc(Prediction.predicted_at))
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()
        if pred:
            risk_counts[pred.risk_level] = risk_counts.get(pred.risk_level, 0) + 1
            gpa_val = pred.features_snapshot.get("gpa") if pred.features_snapshot else None
            if gpa_val is not None:
                gpa_values.append(float(gpa_val))
            if pred.risk_level == "High":
                high_risk_count += 1
                st_result = await db.execute(
                    select(Student, User, Department)
                    .join(User, Student.user_id == User.id)
                    .join(Department, Student.department_id == Department.id)
                    .where(Student.id == sid)
                )
                row = st_result.first()
                if row:
                    top_risk_students.append({
                        "student_id": sid,
                        "id": sid,
                        "name": row.User.name,
                        "student_code": row.Student.student_code,
                        "department": row.Department.name,
                        "risk_level": pred.risk_level,
                        "gpa": pred.features_snapshot.get("gpa", 0),
                        "attendance_pct": pred.features_snapshot.get("attendance_pct", 0),
                    })

    # Audit log recent
    audit_result = await db.execute(
        select(AuditLog).order_by(desc(AuditLog.created_at)).limit(10)
    )
    audit_logs = audit_result.scalars().all()

    avg_gpa = round(sum(gpa_values) / len(gpa_values), 2) if gpa_values else 0.0

    return {
        "kpis": {
            "total_students": total_students.scalar(),
            "total_staff": total_staff.scalar(),
            "total_departments": total_depts.scalar(),
            "high_risk_count": high_risk_count,
            "avg_gpa": avg_gpa,
        },
        "risk_distribution": risk_counts,
        "top_risk_students": top_risk_students[:10],
        "recent_audit_logs": [
            {
                "id": a.id,
                "action": a.action,
                "entity_type": a.entity_type,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in audit_logs
        ],
    }


@router.get("/users", response_model=UserListResponse)
async def get_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    return await list_users(db, role=role, search=search, page=page, size=size)


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def admin_create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    data = body.model_dump()
    user = await create_user(db, data)
    await write_audit_log(db, current_user.id, "user_created", "user", user.id)
    await db.commit()
    await db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def admin_update_user(
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    user = await update_user(db, user_id, body.model_dump(exclude_none=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await write_audit_log(db, current_user.id, "user_updated", "user", user_id)
    await db.commit()
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    deleted = await soft_delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    await write_audit_log(db, current_user.id, "user_deleted", "user", user_id)
    await db.commit()


@router.post("/users/{user_id}/block")
async def toggle_block_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    user = await toggle_user_active(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    action = "user_unblocked" if user.is_active else "user_blocked"
    await write_audit_log(db, current_user.id, action, "user", user_id)
    await db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    temp_pass = await reset_user_password(db, user_id)
    if not temp_pass:
        raise HTTPException(status_code=404, detail="User not found")
    await write_audit_log(db, current_user.id, "password_reset", "user", user_id)
    await db.commit()
    return {"temp_password": temp_pass}


# ── Departments ──────────────────────────────────────────────────────────────

@router.get("/departments")
async def list_departments(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    result = await db.execute(select(Department))
    depts = result.scalars().all()
    out = []
    for d in depts:
        sc = await db.execute(select(func.count(Student.id)).where(Student.department_id == d.id))
        staf = await db.execute(select(func.count(StaffProfile.id)).where(StaffProfile.department_id == d.id))
        out.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "student_count": sc.scalar(),
            "staff_count": staf.scalar(),
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })
    return out


@router.post("/departments", status_code=status.HTTP_201_CREATED)
async def create_department(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    existing = await db.execute(select(Department).where(Department.code == body.get("code", "")))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department code already exists")
    dept = Department(name=body["name"], code=body["code"])
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return {"id": dept.id, "name": dept.name, "code": dept.code}


@router.put("/departments/{dept_id}")
async def update_department(
    dept_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if body.get("name"):
        dept.name = body["name"]
    if body.get("code"):
        dept.code = body["code"]
    await db.commit()
    await db.refresh(dept)
    return {"id": dept.id, "name": dept.name, "code": dept.code}


@router.delete("/departments/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    dept_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    sc = await db.execute(select(func.count(Student.id)).where(Student.department_id == dept_id))
    if sc.scalar() > 0:
        raise HTTPException(status_code=400, detail="Cannot delete — students assigned to this dept")
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    await db.delete(dept)
    await db.commit()


@router.post("/departments/{dept_id}/assign-mentor")
async def assign_mentor(
    dept_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    staff_id = body.get("staff_id")
    student_ids = body.get("student_ids", [])

    sp_result = await db.execute(select(StaffProfile).where(StaffProfile.id == staff_id))
    staff = sp_result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    assigned = []
    for sid in student_ids:
        existing = await db.execute(
            select(StaffStudent).where(StaffStudent.staff_id == staff_id, StaffStudent.student_id == sid)
        )
        if not existing.scalar_one_or_none():
            assignment = StaffStudent(staff_id=staff_id, student_id=sid)
            db.add(assignment)
            assigned.append(sid)

    await db.commit()
    return {"assigned": assigned}


# ── Bulk Upload ──────────────────────────────────────────────────────────────

@router.post("/bulk-upload/students")
async def bulk_upload_students_endpoint(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    content = await file.read()
    result = await bulk_upload_students(db, content, current_user.id)
    await write_audit_log(
        db, current_user.id, "bulk_upload_students", "student",
        metadata={"created": result["created"], "skipped": result["skipped"]}
    )
    await db.commit()
    return result


@router.post("/bulk-upload/staff")
async def bulk_upload_staff_endpoint(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    content = await file.read()
    result = await bulk_upload_staff(db, content, current_user.id)
    await write_audit_log(
        db, current_user.id, "bulk_upload_staff", "staff",
        metadata={"created": result["created"]}
    )
    await db.commit()
    return result


# ── Settings ─────────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    s = await get_system_settings(db)
    return {
        "id": s.id,
        "high_risk_threshold": s.high_risk_threshold,
        "medium_risk_threshold": s.medium_risk_threshold,
        "attendance_weight": s.attendance_weight,
        "gpa_weight": s.gpa_weight,
        "reward_weight": s.reward_weight,
        "activity_weight": s.activity_weight,
        "placement_gpa_floor": s.placement_gpa_floor,
        "placement_attendance_floor": s.placement_attendance_floor,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


@router.put("/settings")
async def update_settings_endpoint(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    s = await get_system_settings(db)
    allowed_fields = [
        "high_risk_threshold", "medium_risk_threshold",
        "attendance_weight", "gpa_weight", "reward_weight", "activity_weight",
        "placement_gpa_floor", "placement_attendance_floor",
    ]
    for field in allowed_fields:
        if field in body:
            setattr(s, field, float(body[field]))

    get_engine().update_thresholds(s.placement_gpa_floor, s.placement_attendance_floor)
    await write_audit_log(db, current_user.id, "settings_updated", "system_settings", 1, metadata=body)
    await db.commit()
    await db.refresh(s)
    return {"updated": True}


@router.post("/settings/recalculate")
async def recalculate_predictions(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    students_result = await db.execute(select(Student.id))
    student_ids = [r[0] for r in students_result.all()]
    job_id = f"recalc_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

    async def _batch_predict():
        import logging as _log
        _logger = _log.getLogger(__name__)
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as batch_db:
            for sid in student_ids:
                try:
                    await run_prediction_for_student(batch_db, sid)
                    await batch_db.commit()
                except Exception as e:
                    _logger.error("Recalculate prediction failed for student_id=%s: %s", sid, e, exc_info=True)

    background_tasks.add_task(_batch_predict)
    await write_audit_log(db, current_user.id, "batch_recalculate", "prediction")
    await db.commit()
    return {"job_id": job_id, "student_count": len(student_ids)}


# ── Model Governance ─────────────────────────────────────────────────────────

@router.get("/model/versions")
async def list_model_versions(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    engine = get_engine()
    return engine.list_versions()


@router.post("/model/promote/{version_id}")
async def promote_model(
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    engine = get_engine()
    try:
        engine.promote(version_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    await write_audit_log(db, current_user.id, "model_promoted", "model_registry", metadata={"version_id": version_id})
    await db.commit()
    return {"promoted": version_id}


# ── Audit Logs ───────────────────────────────────────────────────────────────

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    total_result = await db.execute(select(func.count(AuditLog.id)))
    total = total_result.scalar()

    result = await db.execute(
        select(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .offset((page - 1) * size)
        .limit(size)
    )
    logs = result.scalars().all()

    import math
    return {
        "items": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "action": l.action,
                "entity_type": l.entity_type,
                "entity_id": l.entity_id,
                "ip_address": l.ip_address,
                "metadata": l.log_metadata,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if size else 1,
    }
