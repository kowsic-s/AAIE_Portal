from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class PredictionRequest(BaseModel):
    student_id: int
    features: dict


class PredictionResponse(BaseModel):
    id: Optional[int] = None
    prediction_id: Optional[str] = None
    student_id: int
    model_version: str
    model_type: str
    risk_level: Literal["Low", "Medium", "High"]
    confidence: float
    confidence_tier: Literal["HIGH", "MEDIUM", "LOW"]
    placement_eligible: bool
    prob_low: Optional[float] = None
    prob_medium: Optional[float] = None
    prob_high: Optional[float] = None
    top_factors: list[dict]
    explanation: str
    features_snapshot: Optional[dict] = None
    predicted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BatchPredictionRequest(BaseModel):
    student_ids: list[int]

    def __len__(self) -> int:
        return len(self.student_ids)


class SimulateRequest(BaseModel):
    attendance_pct: float
    gpa: float
    reward_points: int
    activity_points: int
