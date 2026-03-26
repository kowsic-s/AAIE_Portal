"""User management service."""

import secrets
import string
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from app.models.user import User
from app.models.student import Student
from app.models.student import StaffStudent
from app.models.staff_profile import StaffProfile
from app.models.audit_log import AuditLog
from app.models.intervention import Intervention
from app.models.performance import PerformanceRecord
from app.models.prediction import Prediction
from app.models.recommendation import Recommendation
from app.services.auth_service import hash_password


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#"
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def list_users(
    db: AsyncSession,
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> dict:
    query = select(User)
    count_query = select(func.count(User.id))

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    if search:
        pattern = f"%{search}%"
        query = query.where((User.name.ilike(pattern)) | (User.email.ilike(pattern)))
        count_query = count_query.where(
            (User.name.ilike(pattern)) | (User.email.ilike(pattern))
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    # Enrich users with department info
    enriched = []
    for u in users:
        row = {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login,
            "created_at": u.created_at,
            "department_id": None,
            "department_name": None,
        }
        if u.role == "student":
            sp = await db.execute(
                select(Student).where(Student.user_id == u.id)
            )
            student = sp.scalar_one_or_none()
            if student:
                from app.models.department import Department
                dp = await db.execute(
                    select(Department.name).where(Department.id == student.department_id)
                )
                dept_name = dp.scalar_one_or_none()
                row["department_id"] = student.department_id
                row["department_name"] = dept_name
        elif u.role == "staff":
            sp = await db.execute(
                select(StaffProfile).where(StaffProfile.user_id == u.id)
            )
            staff = sp.scalar_one_or_none()
            if staff:
                from app.models.department import Department
                dp = await db.execute(
                    select(Department.name).where(Department.id == staff.department_id)
                )
                dept_name = dp.scalar_one_or_none()
                row["department_id"] = staff.department_id
                row["department_name"] = dept_name
        enriched.append(row)

    import math
    pages = math.ceil(total / size) if size else 1

    return {"items": enriched, "total": total, "page": page, "size": size, "pages": pages}


async def create_user(db: AsyncSession, data: dict) -> User:
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        role=data["role"],
        is_active=True,
    )
    db.add(user)
    await db.flush()

    if data["role"] == "student" and data.get("department_id") and data.get("student_code"):
        student = Student(
            user_id=user.id,
            student_code=data["student_code"],
            department_id=data["department_id"],
            batch_year=data.get("batch_year", 2024),
        )
        db.add(student)

    elif data["role"] == "staff" and data.get("department_id") and data.get("employee_code"):
        profile = StaffProfile(
            user_id=user.id,
            department_id=data["department_id"],
            employee_code=data["employee_code"],
        )
        db.add(profile)

    await db.flush()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user_id: int, data: dict) -> Optional[User]:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None

    update_data = {k: v for k, v in data.items() if v is not None}
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for k, v in update_data.items():
        if hasattr(user, k):
            setattr(user, k, v)

    await db.flush()
    await db.refresh(user)
    return user


async def toggle_user_active(db: AsyncSession, user_id: int) -> Optional[User]:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    user.is_active = not user.is_active
    await db.flush()
    await db.refresh(user)
    return user


async def reset_user_password(db: AsyncSession, user_id: int) -> Optional[str]:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    temp_password = _generate_temp_password()
    user.password_hash = hash_password(temp_password)
    await db.flush()
    return temp_password


async def set_user_password(db: AsyncSession, user_id: int, new_password: str) -> bool:
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    user.password_hash = hash_password(new_password)
    await db.flush()
    return True


async def delete_user(db: AsyncSession, user_id: int) -> bool:
    user = await get_user_by_id(db, user_id)
    if not user:
        return False

    # Keep historical records while removing user account references.
    await db.execute(
        update(AuditLog).where(AuditLog.user_id == user_id).values(user_id=None)
    )
    await db.execute(
        update(PerformanceRecord)
        .where(PerformanceRecord.recorded_by == user_id)
        .values(recorded_by=None)
    )

    student_result = await db.execute(select(Student).where(Student.user_id == user_id))
    student_profile = student_result.scalar_one_or_none()
    if student_profile:
        await db.execute(
            delete(Intervention).where(Intervention.student_id == student_profile.id)
        )
        await db.execute(
            delete(Recommendation).where(Recommendation.student_id == student_profile.id)
        )
        await db.execute(delete(Prediction).where(Prediction.student_id == student_profile.id))
        await db.execute(
            delete(PerformanceRecord).where(PerformanceRecord.student_id == student_profile.id)
        )
        await db.execute(
            delete(StaffStudent).where(StaffStudent.student_id == student_profile.id)
        )
        await db.execute(delete(Student).where(Student.id == student_profile.id))

    staff_result = await db.execute(
        select(StaffProfile).where(StaffProfile.user_id == user_id)
    )
    staff_profile = staff_result.scalar_one_or_none()
    if staff_profile:
        await db.execute(delete(Intervention).where(Intervention.staff_id == staff_profile.id))
        await db.execute(delete(StaffStudent).where(StaffStudent.staff_id == staff_profile.id))
        await db.execute(delete(StaffProfile).where(StaffProfile.id == staff_profile.id))

    await db.execute(delete(User).where(User.id == user_id))
    await db.flush()
    return True
