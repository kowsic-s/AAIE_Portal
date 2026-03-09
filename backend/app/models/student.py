from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    student_code = Column(String(30), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    batch_year = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    performance_records = relationship("PerformanceRecord", back_populates="student")
    predictions = relationship("Prediction", back_populates="student")
    interventions = relationship("Intervention", back_populates="student")
    recommendations = relationship("Recommendation", back_populates="student")
    mentor_assignments = relationship("StaffStudent", back_populates="student")


class StaffStudent(Base):
    __tablename__ = "staff_students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    staff_id = Column(Integer, ForeignKey("staff_profiles.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    assigned_at = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("staff_id", "student_id", name="uq_staff_student"),)

    # Relationships
    staff = relationship("StaffProfile", back_populates="student_assignments")
    student = relationship("Student", back_populates="mentor_assignments")
