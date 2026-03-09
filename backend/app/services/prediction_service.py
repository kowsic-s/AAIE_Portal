"""Prediction service — bridges ML engine with database persistence."""

import asyncio
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.prediction import Prediction
from app.models.student import Student
from app.models.performance import PerformanceRecord
from app.models.settings import SystemSettings
from app.ml.engine import get_engine


async def get_latest_performance(db: AsyncSession, student_id: int) -> Optional[PerformanceRecord]:
    result = await db.execute(
        select(PerformanceRecord)
        .where(PerformanceRecord.student_id == student_id)
        .order_by(desc(PerformanceRecord.recorded_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_system_settings(db: AsyncSession) -> SystemSettings:
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SystemSettings(id=1)
        db.add(settings)
        await db.flush()
    return settings


async def run_prediction_for_student(
    db: AsyncSession,
    student_id: int,
    recorded_by_user_id: Optional[int] = None,
) -> Optional[dict]:
    """Fetch latest performance, run ML prediction, persist to DB."""
    perf = await get_latest_performance(db, student_id)
    if not perf:
        return None

    sys_settings = await get_system_settings(db)
    engine = get_engine()
    engine.update_thresholds(
        sys_settings.placement_gpa_floor,
        sys_settings.placement_attendance_floor,
    )

    features = {
        "attendance_pct": perf.attendance_pct,
        "gpa": perf.gpa,
        "reward_points": perf.reward_points,
        "activity_points": perf.activity_points,
    }

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, engine.predict, student_id, features)

    prediction = Prediction(
        student_id=student_id,
        model_version=result["model_version"],
        model_type=result["model_type"],
        risk_level=result["risk_level"],
        confidence=result["confidence"],
        confidence_tier=result["confidence_tier"],
        placement_eligible=result["placement_eligible"],
        prob_low=result["prob_low"],
        prob_medium=result["prob_medium"],
        prob_high=result["prob_high"],
        features_snapshot=result["features_used"],
        top_factors=result["top_factors"],
        explanation=result["explanation"],
        sync_status="complete",
        predicted_at=datetime.now(timezone.utc),
    )
    db.add(prediction)
    await db.flush()
    await db.refresh(prediction)

    result["id"] = prediction.id
    return result


async def get_latest_prediction(db: AsyncSession, student_id: int) -> Optional[Prediction]:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.student_id == student_id)
        .order_by(desc(Prediction.predicted_at))
        .limit(1)
    )
    return result.scalar_one_or_none()
