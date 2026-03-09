from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from datetime import datetime


class StudentResponse(BaseModel):
    id: int
    user_id: int
    student_code: str
    department_id: int
    batch_year: int
    name: Optional[str] = None
    email: Optional[str] = None
    department_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PerformanceRecordCreate(BaseModel):
    attendance_pct: float
    gpa: float
    reward_points: int = 0
    activity_points: int = 0
    semester: str

    @field_validator("attendance_pct")
    @classmethod
    def validate_attendance(cls, v: float) -> float:
        if not 0 <= v <= 100:
            raise ValueError("Attendance must be between 0 and 100")
        return v

    @field_validator("gpa")
    @classmethod
    def validate_gpa(cls, v: float) -> float:
        if not 0 <= v <= 10:
            raise ValueError("GPA must be between 0 and 10")
        return v

    @field_validator("reward_points")
    @classmethod
    def validate_reward_points(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Reward points must be non-negative")
        return v

    @field_validator("activity_points")
    @classmethod
    def validate_activity_points(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Activity points must be non-negative")
        return v


class PerformanceRecordResponse(BaseModel):
    id: int
    student_id: int
    attendance_pct: float
    gpa: float
    reward_points: int
    activity_points: int
    semester: str
    recorded_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class WhatIfRequest(BaseModel):
    attendance_pct: float
    gpa: float
    reward_points: int
    activity_points: int

    @field_validator("attendance_pct")
    @classmethod
    def validate_attendance(cls, v: float) -> float:
        if not 0 <= v <= 100:
            raise ValueError("Attendance must be between 0 and 100")
        return v

    @field_validator("gpa")
    @classmethod
    def validate_gpa(cls, v: float) -> float:
        if not 0 <= v <= 10:
            raise ValueError("GPA must be between 0 and 10")
        return v
