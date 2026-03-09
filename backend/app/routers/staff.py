"""Staff router — department-scoped student management and interventions."""

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_

from app.database import get_db
from app.middleware.rbac import require_role, CurrentUser
from app.middleware.audit import write_audit_log
from app.models.user import User
from app.models.student import Student, StaffStudent
from app.models.staff_profile import StaffProfile
from app.models.department import Department
from app.models.performance import PerformanceRecord
from app.models.prediction import Prediction
from app.models.intervention import Intervention
from app.models.recommendation import Recommendation
from app.schemas.intervention import InterventionCreate, InterventionUpdate, InterventionResponse
from app.services.upload_service import bulk_upload_performance
from app.services.prediction_service import run_prediction_for_student, get_latest_prediction
from app.services.gemini_service import get_gemini_service

router = APIRouter(prefix="/staff", tags=["staff"])
StaffUser = Depends(require_role("staff"))


async def _get_staff_profile(db: AsyncSession, user_id: int) -> StaffProfile:
    result = await db.execute(
        select(StaffProfile).where(StaffProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Staff profile not found")
    return profile


@router.get("/dashboard")
async def staff_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    staff = await _get_staff_profile(db, current_user.id)

    students_result = await db.execute(
        select(Student).where(Student.department_id == staff.department_id)
    )
    students = students_result.scalars().all()
    student_ids = [s.id for s in students]
    total_students = len(student_ids)

    open_interventions = await db.execute(
        select(func.count(Intervention.id)).where(
            Intervention.staff_id == staff.id,
            Intervention.status.in_(["open", "in_progress"]),
        )
    )

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    closed_this_month = await db.execute(
        select(func.count(Intervention.id)).where(
            Intervention.staff_id == staff.id,
            Intervention.status == "closed",
            Intervention.closed_at >= month_start,
        )
    )

    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    high_risk = 0
    for sid in student_ids:
        pred = await get_latest_prediction(db, sid)
        if pred:
            risk_counts[pred.risk_level] = risk_counts.get(pred.risk_level, 0) + 1
            if pred.risk_level == "High":
                high_risk += 1

    # Recent risk changes (last 7 days)
    week_ago = now - timedelta(days=7)
    recent_changes = []
    for sid in student_ids[:20]:
        prev = await db.execute(
            select(Prediction)
            .where(Prediction.student_id == sid, Prediction.predicted_at <= week_ago)
            .order_by(desc(Prediction.predicted_at))
            .limit(1)
        )
        curr = await db.execute(
            select(Prediction)
            .where(Prediction.student_id == sid)
            .order_by(desc(Prediction.predicted_at))
            .limit(1)
        )
        p = prev.scalar_one_or_none()
        c = curr.scalar_one_or_none()
        if p and c and p.risk_level != c.risk_level:
            st = next((s for s in students if s.id == sid), None)
            if st:
                user_r = await db.execute(select(User).where(User.id == st.user_id))
                u = user_r.scalar_one_or_none()
                recent_changes.append({
                    "student_id": sid,
                    "name": u.name if u else "",
                    "from_risk": p.risk_level,
                    "to_risk": c.risk_level,
                    "changed_at": c.predicted_at.isoformat() if c.predicted_at else None,
                })

    return {
        "kpis": {
            "total_students": total_students,
            "high_risk_count": high_risk,
            "open_interventions": open_interventions.scalar(),
            "closed_this_month": closed_this_month.scalar(),
        },
        "risk_distribution": risk_counts,
        "recent_risk_changes": recent_changes,
    }


@router.get("/students")
async def list_staff_students(
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    staff = await _get_staff_profile(db, current_user.id)

    query = (
        select(Student, User, Department)
        .join(User, Student.user_id == User.id)
        .join(Department, Student.department_id == Department.id)
        .where(Student.department_id == staff.department_id)
    )

    if search:
        pattern = f"%{search}%"
        query = query.where(
            (User.name.ilike(pattern)) | (Student.student_code.ilike(pattern))
        )

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total_count = count_result.scalar() or 0

    result = await db.execute(query.order_by(User.name).offset((page - 1) * size).limit(size))
    rows = result.all()

    items = []
    for row in rows:
        s, u, d = row.Student, row.User, row.Department
        pred = await get_latest_prediction(db, s.id)
        if risk_level and (not pred or pred.risk_level != risk_level):
            continue

        latest_perf = await db.execute(
            select(PerformanceRecord)
            .where(PerformanceRecord.student_id == s.id)
            .order_by(desc(PerformanceRecord.recorded_at))
            .limit(1)
        )
        perf = latest_perf.scalar_one_or_none()

        items.append({
            "id": s.id,
            "name": u.name,
            "email": u.email,
            "student_code": s.student_code,
            "department": d.name,
            "batch_year": s.batch_year,
            "gpa": perf.gpa if perf else None,
            "attendance_pct": perf.attendance_pct if perf else None,
            "risk_level": pred.risk_level if pred else None,
            "confidence": pred.confidence if pred else None,
            "placement_eligible": pred.placement_eligible if pred else None,
        })

    return {"items": items, "total": total_count, "page": page, "size": size}


@router.get("/students/{student_id}")
async def get_student_detail(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    staff = await _get_staff_profile(db, current_user.id)

    st_result = await db.execute(
        select(Student, User, Department)
        .join(User, Student.user_id == User.id)
        .join(Department, Student.department_id == Department.id)
        .where(Student.id == student_id, Student.department_id == staff.department_id)
    )
    row = st_result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Student not found in your department")

    s, u, d = row.Student, row.User, row.Department
    pred = await get_latest_prediction(db, s.id)

    perf_result = await db.execute(
        select(PerformanceRecord)
        .where(PerformanceRecord.student_id == s.id)
        .order_by(PerformanceRecord.semester)
    )
    perfs = perf_result.scalars().all()

    int_result = await db.execute(
        select(Intervention)
        .where(Intervention.student_id == s.id)
        .order_by(desc(Intervention.created_at))
    )
    interventions = int_result.scalars().all()

    return {
        "student": {
            "id": s.id,
            "name": u.name,
            "email": u.email,
            "student_code": s.student_code,
            "department": d.name,
            "department_id": d.id,
            "batch_year": s.batch_year,
        },
        "latest_prediction": {
            "risk_level": pred.risk_level,
            "confidence": pred.confidence,
            "confidence_tier": pred.confidence_tier,
            "placement_eligible": pred.placement_eligible,
            "explanation": pred.explanation,
            "top_factors": pred.top_factors,
            "prob_low": pred.prob_low,
            "prob_medium": pred.prob_medium,
            "prob_high": pred.prob_high,
            "predicted_at": pred.predicted_at.isoformat() if pred.predicted_at else None,
        } if pred else None,
        "performance_history": [
            {
                "id": p.id,
                "semester": p.semester,
                "attendance_pct": p.attendance_pct,
                "gpa": p.gpa,
                "reward_points": p.reward_points,
                "activity_points": p.activity_points,
                "recorded_at": p.recorded_at.isoformat() if p.recorded_at else None,
            }
            for p in perfs
        ],
        "interventions": [
            {
                "id": i.id,
                "type": i.type,
                "description": i.description,
                "status": i.status,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in interventions
        ],
    }


@router.post("/students/upload")
async def upload_performance_bulk(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    """Bulk performance upload for all students in the staff's department."""
    staff = await _get_staff_profile(db, current_user.id)
    content = await file.read()
    result = await bulk_upload_performance(db, content, staff, current_user.id, background_tasks)
    await write_audit_log(db, current_user.id, "performance_upload", "performance_record")
    await db.commit()
    return result


@router.post("/students/{student_id}/upload")
async def upload_student_records(
    student_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    """Performance upload for a single specific student."""
    staff = await _get_staff_profile(db, current_user.id)
    content = await file.read()
    result = await bulk_upload_performance(db, content, staff, current_user.id, background_tasks)
    await write_audit_log(db, current_user.id, "performance_upload", "performance_record")
    await db.commit()
    return result


@router.get("/interventions")
async def list_interventions(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    staff = await _get_staff_profile(db, current_user.id)

    query = select(Intervention).where(Intervention.staff_id == staff.id)
    if status_filter:
        query = query.where(Intervention.status == status_filter)

    total = await db.execute(
        select(func.count(Intervention.id)).where(Intervention.staff_id == staff.id)
    )
    result = await db.execute(
        query.order_by(desc(Intervention.created_at)).offset((page - 1) * size).limit(size)
    )
    interventions = result.scalars().all()

    items = []
    for i in interventions:
        st_r = await db.execute(
            select(Student, User)
            .join(User, Student.user_id == User.id)
            .where(Student.id == i.student_id)
        )
        st_row = st_r.first()
        items.append({
            "id": i.id,
            "student_id": i.student_id,
            "student_name": st_row.User.name if st_row else None,
            "student_code": st_row.Student.student_code if st_row else None,
            "type": i.type,
            "description": i.description,
            "status": i.status,
            "closed_at": i.closed_at.isoformat() if i.closed_at else None,
            "created_at": i.created_at.isoformat() if i.created_at else None,
            "updated_at": i.updated_at.isoformat() if i.updated_at else None,
        })

    import math
    total_val = total.scalar()
    return {
        "items": items,
        "total": total_val,
        "page": page,
        "size": size,
        "pages": math.ceil(total_val / size) if size else 1,
    }


@router.post("/interventions", status_code=status.HTTP_201_CREATED)
async def create_intervention(
    body: InterventionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    staff = await _get_staff_profile(db, current_user.id)

    st_result = await db.execute(
        select(Student).where(
            Student.id == body.student_id,
            Student.department_id == staff.department_id,
        )
    )
    if not st_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Student not found in your department")

    intervention = Intervention(
        staff_id=staff.id,
        student_id=body.student_id,
        type=body.type,
        description=body.description,
        status="open",
    )
    db.add(intervention)
    await db.flush()
    await write_audit_log(
        db, current_user.id, "intervention_created", "intervention", intervention.id,
        metadata={"type": body.type, "student_id": body.student_id}
    )
    await db.commit()
    await db.refresh(intervention)
    return {
        "id": intervention.id,
        "staff_id": intervention.staff_id,
        "student_id": intervention.student_id,
        "type": intervention.type,
        "description": intervention.description,
        "status": intervention.status,
        "created_at": intervention.created_at.isoformat() if intervention.created_at else None,
    }


@router.put("/interventions/{intervention_id}")
async def update_intervention(
    intervention_id: int,
    body: InterventionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    staff = await _get_staff_profile(db, current_user.id)

    result = await db.execute(
        select(Intervention).where(
            Intervention.id == intervention_id,
            Intervention.staff_id == staff.id,
        )
    )
    intervention = result.scalar_one_or_none()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    if body.status:
        intervention.status = body.status
        if body.status == "closed":
            intervention.closed_at = datetime.now(timezone.utc)
    if body.description:
        intervention.description = body.description

    await db.commit()
    await db.refresh(intervention)
    return {"id": intervention.id, "status": intervention.status}


@router.get("/students/{student_id}/recommendations")
async def get_student_recommendations(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StaffUser,
):
    staff = await _get_staff_profile(db, current_user.id)

    st_result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.department_id == staff.department_id,
        )
    )
    student = st_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not in your dept")

    pred = await get_latest_prediction(db, student_id)
    if not pred:
        raise HTTPException(status_code=400, detail="No prediction available for student")

    from app.config import get_settings as cfg
    gemini = get_gemini_service()
    content = await gemini.generate_recommendation(
        attendance_pct=pred.features_snapshot.get("attendance_pct", 0),
        gpa=pred.features_snapshot.get("gpa", 0),
        reward_points=pred.features_snapshot.get("reward_points", 0),
        activity_points=pred.features_snapshot.get("activity_points", 0),
        risk_level=pred.risk_level,
    )

    rec = Recommendation(
        student_id=student_id,
        content=content,
        model_used=cfg().GEMINI_MODEL,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    return {
        "id": rec.id,
        "content": rec.content,
        "generated_at": rec.generated_at.isoformat() if rec.generated_at else None,
        "model_used": rec.model_used,
    }
