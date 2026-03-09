from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class InterventionCreate(BaseModel):
    student_id: int
    type: Literal[
        "counselling",
        "academic_support",
        "warning_letter",
        "parent_meeting",
        "peer_mentoring",
    ]
    description: str


class InterventionUpdate(BaseModel):
    status: Optional[Literal["open", "in_progress", "closed"]] = None
    description: Optional[str] = None


class InterventionResponse(BaseModel):
    id: int
    staff_id: int
    student_id: int
    type: str
    description: str
    status: str
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    student_name: Optional[str] = None
    student_code: Optional[str] = None

    model_config = {"from_attributes": True}
