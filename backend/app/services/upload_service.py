"""CSV upload service for bulk student/staff/performance imports."""

import io
import csv
import logging
from typing import BinaryIO, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.student import Student
from app.models.staff_profile import StaffProfile
from app.models.department import Department
from app.models.performance import PerformanceRecord
from app.services.auth_service import hash_password
from app.services.prediction_service import run_prediction_for_student

logger = logging.getLogger(__name__)

REQUIRED_STUDENT_COLS = {"name", "email", "student_code", "department_code", "batch_year"}
REQUIRED_STAFF_COLS = {"name", "email", "employee_code", "department_code"}
REQUIRED_PERF_COLS = {"student_code", "attendance_pct", "gpa", "reward_points", "activity_points", "semester"}


def _gen_student_password(name: str, student_code: str) -> str:
    first4 = name.strip().replace(" ", "").lower()[:4]
    last4 = student_code.strip()[-4:]
    return first4 + last4


def _gen_staff_password(name: str, employee_code: str) -> str:
    first4 = name.strip().replace(" ", "").lower()[:4]
    last4 = employee_code.strip()[-4:]
    return first4 + last4


def _sanitize_str(s: str) -> str:
    """Basic injection prevention — strip dangerous characters."""
    return s.replace(";", "").replace("--", "").replace("/*", "").replace("*/", "").strip()


async def bulk_upload_students(
    db: AsyncSession, file_content: bytes, uploaded_by_id: int
) -> dict:
    content = file_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)

    if not rows:
        return {"total": 0, "created": 0, "skipped": 0, "errors": [{"row": 0, "reason": "Empty file"}]}

    fieldnames = set(reader.fieldnames or [])
    missing = REQUIRED_STUDENT_COLS - fieldnames
    if missing:
        return {"total": 0, "created": 0, "skipped": 0, "errors": [{"row": 0, "reason": f"Missing columns: {missing}"}]}

    created = 0
    skipped = 0
    errors = []

    for idx, row in enumerate(rows, start=2):
        try:
            name = _sanitize_str(row["name"])
            email = _sanitize_str(row["email"].lower())
            student_code = _sanitize_str(row["student_code"])
            department_code = _sanitize_str(row["department_code"])
            batch_year = int(row["batch_year"])

            # Check email uniqueness
            existing = await db.execute(select(User).where(User.email == email))
            if existing.scalar_one_or_none():
                skipped += 1
                errors.append({"row": idx, "reason": f"Email {email} already exists"})
                continue

            # Resolve department
            dept_result = await db.execute(
                select(Department).where(Department.code == department_code)
            )
            dept = dept_result.scalar_one_or_none()
            if not dept:
                errors.append({"row": idx, "reason": f"Department code {department_code} not found"})
                skipped += 1
                continue

            # Check student_code uniqueness
            sc_check = await db.execute(select(Student).where(Student.student_code == student_code))
            if sc_check.scalar_one_or_none():
                skipped += 1
                errors.append({"row": idx, "reason": f"Student code {student_code} already exists"})
                continue

            password = _gen_student_password(name, student_code)
            user = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role="student",
                is_active=True,
            )
            db.add(user)
            await db.flush()

            student = Student(
                user_id=user.id,
                student_code=student_code,
                department_id=dept.id,
                batch_year=batch_year,
            )
            db.add(student)
            await db.flush()
            created += 1

        except Exception as e:
            errors.append({"row": idx, "reason": str(e)})
            skipped += 1

    await db.commit()
    return {"total": len(rows), "created": created, "skipped": skipped, "errors": errors}


async def bulk_upload_staff(
    db: AsyncSession, file_content: bytes, uploaded_by_id: int
) -> dict:
    content = file_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)

    if not rows:
        return {"total": 0, "created": 0, "skipped": 0, "errors": []}

    fieldnames = set(reader.fieldnames or [])
    missing = REQUIRED_STAFF_COLS - fieldnames
    if missing:
        return {"total": 0, "created": 0, "skipped": 0, "errors": [{"row": 0, "reason": f"Missing columns: {missing}"}]}

    created = 0
    skipped = 0
    errors = []

    for idx, row in enumerate(rows, start=2):
        try:
            name = _sanitize_str(row["name"])
            email = _sanitize_str(row["email"].lower())
            employee_code = _sanitize_str(row["employee_code"])
            department_code = _sanitize_str(row["department_code"])

            existing = await db.execute(select(User).where(User.email == email))
            if existing.scalar_one_or_none():
                skipped += 1
                errors.append({"row": idx, "reason": f"Email {email} already exists"})
                continue

            dept_result = await db.execute(
                select(Department).where(Department.code == department_code)
            )
            dept = dept_result.scalar_one_or_none()
            if not dept:
                errors.append({"row": idx, "reason": f"Department {department_code} not found"})
                skipped += 1
                continue

            ec_check = await db.execute(
                select(StaffProfile).where(StaffProfile.employee_code == employee_code)
            )
            if ec_check.scalar_one_or_none():
                skipped += 1
                errors.append({"row": idx, "reason": f"Employee code {employee_code} exists"})
                continue

            user = User(
                name=name,
                email=email,
                password_hash=hash_password(_gen_staff_password(name, employee_code)),
                role="staff",
                is_active=True,
            )
            db.add(user)
            await db.flush()

            profile = StaffProfile(
                user_id=user.id,
                department_id=dept.id,
                employee_code=employee_code,
            )
            db.add(profile)
            await db.flush()
            created += 1

        except Exception as e:
            errors.append({"row": idx, "reason": str(e)})
            skipped += 1

    await db.commit()
    return {"total": len(rows), "created": created, "skipped": skipped, "errors": errors}


async def bulk_upload_performance(
    db: AsyncSession,
    file_content: bytes,
    staff_profile: StaffProfile,
    uploaded_by_id: int,
    background_tasks=None,
) -> dict:
    content = file_content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)

    if not rows:
        return {"total": 0, "created": 0, "updated": 0, "failed": 0, "errors": []}

    fieldnames = set(reader.fieldnames or [])
    missing = REQUIRED_PERF_COLS - fieldnames
    if missing:
        return {"total": 0, "created": 0, "updated": 0, "failed": 0, "errors": [{"row": 0, "reason": f"Missing: {missing}"}]}

    created = 0
    updated = 0
    failed = 0
    errors = []
    affected_student_ids = []

    for idx, row in enumerate(rows, start=2):
        try:
            student_code = _sanitize_str(row["student_code"])
            attendance_pct = float(row["attendance_pct"])
            gpa = float(row["gpa"])
            reward_points = int(row["reward_points"])
            activity_points = int(row["activity_points"])
            semester = _sanitize_str(row["semester"])

            # Validate ranges
            if not (0 <= attendance_pct <= 100):
                raise ValueError("attendance_pct out of range")
            if not (0 <= gpa <= 10):
                raise ValueError("gpa out of range")

            # Find student in staff's department only
            st_result = await db.execute(
                select(Student).where(
                    Student.student_code == student_code,
                    Student.department_id == staff_profile.department_id,
                )
            )
            student = st_result.scalar_one_or_none()
            if not student:
                errors.append({"row": idx, "reason": f"Student {student_code} not found in your dept"})
                failed += 1
                continue

            # Upsert performance
            existing_perf = await db.execute(
                select(PerformanceRecord).where(
                    PerformanceRecord.student_id == student.id,
                    PerformanceRecord.semester == semester,
                )
            )
            perf = existing_perf.scalar_one_or_none()

            if perf:
                perf.attendance_pct = attendance_pct
                perf.gpa = gpa
                perf.reward_points = reward_points
                perf.activity_points = activity_points
                perf.recorded_by = uploaded_by_id
                updated += 1
            else:
                perf = PerformanceRecord(
                    student_id=student.id,
                    attendance_pct=attendance_pct,
                    gpa=gpa,
                    reward_points=reward_points,
                    activity_points=activity_points,
                    semester=semester,
                    recorded_by=uploaded_by_id,
                )
                db.add(perf)
                created += 1

            affected_student_ids.append(student.id)

        except Exception as e:
            errors.append({"row": idx, "reason": str(e)})
            failed += 1

    await db.commit()

    # Background predictions for affected students
    if background_tasks and affected_student_ids:
        for sid in set(affected_student_ids):
            background_tasks.add_task(_background_predict, sid)

    return {
        "total": len(rows),
        "created": created,
        "updated": updated,
        "failed": failed,
        "errors": errors,
    }


async def _background_predict(student_id: int) -> None:
    """Fire-and-forget prediction after performance upload."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            await run_prediction_for_student(db, student_id)
            await db.commit()
        except Exception as e:
            logger.error(f"Background prediction failed for student {student_id}: {e}")
