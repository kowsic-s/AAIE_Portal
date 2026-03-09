"""
AAIE Seed Script — populates database with initial data and trains the ML model.

Run: python seed.py  (from backend/ directory)
"""

import asyncio
import sys
import os
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import get_settings
from app.models.user import User
from app.models.department import Department
from app.models.student import Student, StaffStudent
from app.models.staff_profile import StaffProfile
from app.models.performance import PerformanceRecord
from app.models.intervention import Intervention
from app.models.settings import SystemSettings
from app.services.auth_service import hash_password
from app.ml.engine import get_engine

settings = get_settings()


SEED_STUDENTS = [
    # Low risk: attendance 85-100, GPA 7-10
    {"name": "Aarav Sharma", "email": "aarav@aaie.edu", "code": "CS2023001", "dept": "CS", "batch": 2023, "attendance": 95.0, "gpa": 8.8, "reward": 120, "activity": 95},
    {"name": "Priya Singh", "email": "priya@aaie.edu", "code": "CS2023002", "dept": "CS", "batch": 2023, "attendance": 92.0, "gpa": 8.2, "reward": 100, "activity": 80},
    {"name": "Rohit Verma", "email": "rohit@aaie.edu", "code": "CS2023003", "dept": "CS", "batch": 2023, "attendance": 88.0, "gpa": 7.5, "reward": 85, "activity": 70},
    {"name": "Sneha Patel", "email": "sneha@aaie.edu", "code": "EC2023001", "dept": "EC", "batch": 2023, "attendance": 90.0, "gpa": 8.0, "reward": 110, "activity": 90},
    {"name": "Kiran Rao", "email": "kiran@aaie.edu", "code": "EC2023002", "dept": "EC", "batch": 2023, "attendance": 87.0, "gpa": 7.8, "reward": 90, "activity": 75},
    {"name": "Meera Nair", "email": "meera@aaie.edu", "code": "ME2023001", "dept": "ME", "batch": 2023, "attendance": 93.0, "gpa": 9.1, "reward": 130, "activity": 100},
    {"name": "Arjun Kumar", "email": "arjun@aaie.edu", "code": "ME2023002", "dept": "ME", "batch": 2023, "attendance": 86.0, "gpa": 7.3, "reward": 75, "activity": 65},
    {"name": "Divya Iyer", "email": "divya@aaie.edu", "code": "CS2023004", "dept": "CS", "batch": 2023, "attendance": 97.0, "gpa": 9.4, "reward": 150, "activity": 115},
    # Medium risk: attendance 70-84, GPA 5-7
    {"name": "Sanjay Mishra", "email": "sanjay@aaie.edu", "code": "CS2023005", "dept": "CS", "batch": 2023, "attendance": 78.0, "gpa": 6.1, "reward": 55, "activity": 45},
    {"name": "Ananya Desai", "email": "ananya@aaie.edu", "code": "EC2023003", "dept": "EC", "batch": 2023, "attendance": 74.0, "gpa": 5.8, "reward": 45, "activity": 38},
    {"name": "Vikram Joshi", "email": "vikram@aaie.edu", "code": "ME2023003", "dept": "ME", "batch": 2023, "attendance": 80.0, "gpa": 6.5, "reward": 60, "activity": 50},
    {"name": "Pooja Gupta", "email": "pooja@aaie.edu", "code": "CS2023006", "dept": "CS", "batch": 2023, "attendance": 72.0, "gpa": 5.3, "reward": 40, "activity": 30},
    {"name": "Rahul Pandey", "email": "rahul@aaie.edu", "code": "EC2023004", "dept": "EC", "batch": 2023, "attendance": 76.0, "gpa": 6.8, "reward": 65, "activity": 55},
    {"name": "Nisha Kapoor", "email": "nisha@aaie.edu", "code": "ME2023004", "dept": "ME", "batch": 2023, "attendance": 71.0, "gpa": 5.6, "reward": 42, "activity": 35},
    {"name": "Aditya Bose", "email": "aditya@aaie.edu", "code": "CS2023007", "dept": "CS", "batch": 2023, "attendance": 82.0, "gpa": 6.9, "reward": 70, "activity": 60},
    # High risk: attendance 50-69, GPA 2-5
    {"name": "Ravi Dubey", "email": "ravi@aaie.edu", "code": "CS2023008", "dept": "CS", "batch": 2023, "attendance": 58.0, "gpa": 3.2, "reward": 15, "activity": 10},
    {"name": "Sunita Das", "email": "sunita@aaie.edu", "code": "EC2023005", "dept": "EC", "batch": 2023, "attendance": 52.0, "gpa": 2.8, "reward": 10, "activity": 8},
    {"name": "Mohan Tiwari", "email": "mohan@aaie.edu", "code": "ME2023005", "dept": "ME", "batch": 2023, "attendance": 61.0, "gpa": 4.1, "reward": 20, "activity": 12},
    {"name": "Geeta Yadav", "email": "geeta@aaie.edu", "code": "CS2023009", "dept": "CS", "batch": 2023, "attendance": 55.0, "gpa": 3.5, "reward": 18, "activity": 14},
    {"name": "Suresh Patil", "email": "suresh@aaie.edu", "code": "EC2023006", "dept": "EC", "batch": 2023, "attendance": 63.0, "gpa": 4.4, "reward": 22, "activity": 16},
]

SEED_SEMESTERS = ["2023-ODD", "2023-EVEN"]

SEED_INTERVENTIONS = [
    {"staff_email": "staff1@aaie.edu", "student_code": "CS2023008", "type": "counselling", "desc": "One-on-one counselling session to discuss attendance challenges and create an improvement plan."},
    {"staff_email": "staff1@aaie.edu", "student_code": "CS2023009", "type": "academic_support", "desc": "Enrolled student in supplementary mathematics tutorial sessions."},
    {"staff_email": "staff2@aaie.edu", "student_code": "EC2023005", "type": "warning_letter", "desc": "Formal warning issued for attendance below 60% threshold."},
    {"staff_email": "staff3@aaie.edu", "student_code": "ME2023005", "type": "parent_meeting", "desc": "Meeting scheduled with parents to discuss academic performance and home study environment."},
    {"staff_email": "staff4@aaie.edu", "student_code": "CS2023005", "type": "peer_mentoring", "desc": "Assigned peer mentor from high-performing CS students to provide subject support."},
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as db:
        print("Seeding departments...")
        dept_map = {}
        for name, code in [("Computer Science", "CS"), ("Electronics", "EC"), ("Mechanical", "ME")]:
            from sqlalchemy import select
            existing = await db.execute(select(Department).where(Department.code == code))
            dept = existing.scalar_one_or_none()
            if not dept:
                dept = Department(name=name, code=code)
                db.add(dept)
                await db.flush()
            dept_map[code] = dept
        await db.commit()

        print("Seeding admin...")
        from sqlalchemy import select
        existing_admin = await db.execute(select(User).where(User.email == "admin@aaie.edu"))
        if not existing_admin.scalar_one_or_none():
            admin = User(
                name="System Admin",
                email="admin@aaie.edu",
                password_hash=hash_password("Admin@123"),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            await db.commit()

        print("Seeding system settings...")
        existing_settings = await db.execute(select(SystemSettings).where(SystemSettings.id == 1))
        if not existing_settings.scalar_one_or_none():
            ss = SystemSettings(id=1)
            db.add(ss)
            await db.commit()

        print("Seeding staff...")
        staff_map = {}
        staff_data = [
            ("Dr. Raj Kumar", "staff1@aaie.edu", "EMP001", "CS"),
            ("Dr. Preet Kaur", "staff2@aaie.edu", "EMP002", "EC"),
            ("Dr. Sunil Mehta", "staff3@aaie.edu", "EMP003", "ME"),
            ("Dr. Anita Shah", "staff4@aaie.edu", "EMP004", "CS"),
        ]
        for name, email, emp_code, dept_code in staff_data:
            existing_u = await db.execute(select(User).where(User.email == email))
            user = existing_u.scalar_one_or_none()
            if not user:
                user = User(
                    name=name,
                    email=email,
                    password_hash=hash_password("Staff@123"),
                    role="staff",
                    is_active=True,
                )
                db.add(user)
                await db.flush()

                profile = StaffProfile(
                    user_id=user.id,
                    department_id=dept_map[dept_code].id,
                    employee_code=emp_code,
                )
                db.add(profile)
                await db.flush()
            else:
                existing_p = await db.execute(select(StaffProfile).where(StaffProfile.user_id == user.id))
                profile = existing_p.scalar_one_or_none()

            if profile:
                staff_map[email] = profile

        await db.commit()

        print("Seeding students and performance records...")
        student_map = {}
        for sd in SEED_STUDENTS:
            existing_u = await db.execute(select(User).where(User.email == sd["email"]))
            user = existing_u.scalar_one_or_none()
            if not user:
                user = User(
                    name=sd["name"],
                    email=sd["email"],
                    password_hash=hash_password("Student@123"),
                    role="student",
                    is_active=True,
                )
                db.add(user)
                await db.flush()

                student = Student(
                    user_id=user.id,
                    student_code=sd["code"],
                    department_id=dept_map[sd["dept"]].id,
                    batch_year=sd["batch"],
                )
                db.add(student)
                await db.flush()
            else:
                existing_s = await db.execute(select(Student).where(Student.user_id == user.id))
                student = existing_s.scalar_one_or_none()

            student_map[sd["code"]] = student

            # Performance records for 2 semesters with slight variation
            for i, sem in enumerate(SEED_SEMESTERS):
                existing_pr = await db.execute(
                    select(PerformanceRecord).where(
                        PerformanceRecord.student_id == student.id,
                        PerformanceRecord.semester == sem,
                    )
                )
                if not existing_pr.scalar_one_or_none():
                    variation = (-2 if i == 0 else 0)
                    perf = PerformanceRecord(
                        student_id=student.id,
                        attendance_pct=max(0, min(100, sd["attendance"] + variation)),
                        gpa=max(0, min(10, sd["gpa"] + variation * 0.1)),
                        reward_points=max(0, sd["reward"] + variation * 2),
                        activity_points=max(0, sd["activity"] + variation * 2),
                        semester=sem,
                    )
                    db.add(perf)

        await db.commit()

        print("Seeding mentor assignments...")
        staff1 = staff_map.get("staff1@aaie.edu")
        staff4 = staff_map.get("staff4@aaie.edu")
        for code, student in student_map.items():
            if code.startswith("CS"):
                for staff_profile in [staff1, staff4]:
                    if staff_profile:
                        existing_ss = await db.execute(
                            select(StaffStudent).where(
                                StaffStudent.staff_id == staff_profile.id,
                                StaffStudent.student_id == student.id,
                            )
                        )
                        if not existing_ss.scalar_one_or_none():
                            assignment = StaffStudent(
                                staff_id=staff_profile.id,
                                student_id=student.id,
                            )
                            db.add(assignment)

        await db.commit()

        print("Seeding interventions...")
        for iv in SEED_INTERVENTIONS:
            staff_profile = staff_map.get(iv["staff_email"])
            student = student_map.get(iv["student_code"])
            if staff_profile and student:
                existing_iv = await db.execute(
                    select(Intervention).where(
                        Intervention.staff_id == staff_profile.id,
                        Intervention.student_id == student.id,
                        Intervention.type == iv["type"],
                    )
                )
                if not existing_iv.scalar_one_or_none():
                    intervention = Intervention(
                        staff_id=staff_profile.id,
                        student_id=student.id,
                        type=iv["type"],
                        description=iv["desc"],
                        status="open",
                    )
                    db.add(intervention)

        await db.commit()

        print("Training initial ML model on seed data...")
        rows = []
        for sd in SEED_STUDENTS:
            if sd["attendance"] >= 85 and sd["gpa"] >= 7.0:
                risk = "Low"
            elif sd["attendance"] >= 70 and sd["gpa"] >= 5.0:
                risk = "Medium"
            else:
                risk = "High"
            rows.append({
                "attendance_pct": sd["attendance"],
                "gpa": sd["gpa"],
                "reward_points": sd["reward"],
                "activity_points": sd["activity"],
                "risk_level": risk,
            })

        # Augment with synthetic data for better training
        import random
        random.seed(42)
        for _ in range(200):
            att = random.uniform(85, 100)
            gpa_val = random.uniform(7, 10)
            rows.append({"attendance_pct": att, "gpa": gpa_val, "reward_points": random.randint(80, 200), "activity_points": random.randint(60, 150), "risk_level": "Low"})
        for _ in range(200):
            att = random.uniform(70, 84)
            gpa_val = random.uniform(5, 7)
            rows.append({"attendance_pct": att, "gpa": gpa_val, "reward_points": random.randint(30, 80), "activity_points": random.randint(20, 60), "risk_level": "Medium"})
        for _ in range(200):
            att = random.uniform(40, 69)
            gpa_val = random.uniform(0, 5)
            rows.append({"attendance_pct": att, "gpa": gpa_val, "reward_points": random.randint(0, 30), "activity_points": random.randint(0, 20), "risk_level": "High"})

        df = pd.DataFrame(rows)
        ml_engine = get_engine()
        version_id = ml_engine.train(df)
        print(f"✓ ML model trained: {version_id}")

        print("Running initial predictions for all students...")
        from app.services.prediction_service import run_prediction_for_student
        all_students = await db.execute(select(Student))
        students_list = all_students.scalars().all()
        for s in students_list:
            try:
                await run_prediction_for_student(db, s.id)
                await db.commit()
            except Exception as e:
                print(f"  Prediction failed for student {s.id}: {e}")

        print("\n✅ Seed complete!")
        print("  Admin:   admin@aaie.edu / Admin@123")
        print("  Staff:   staff1@aaie.edu ... staff4@aaie.edu / Staff@123")
        print("  Students: <email>@aaie.edu / Student@123")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
