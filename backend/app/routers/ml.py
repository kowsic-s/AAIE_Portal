"""ML router — prediction, training, model management."""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.rbac import require_role, CurrentUser
from app.middleware.audit import write_audit_log
from app.models.student import Student
from app.models.performance import PerformanceRecord
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionRequest, BatchPredictionRequest, SimulateRequest
from app.services.prediction_service import (
    run_prediction_for_student,
    get_system_settings,
    get_latest_performance,
)
from app.ml.engine import get_engine
import pandas as pd

router = APIRouter(prefix="/ml", tags=["ml"])
AdminUser = Depends(require_role("admin"))


@router.post("/predict")
async def predict_single(
    body: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    result = await run_prediction_for_student(db, body.student_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="No performance data for student")
    await write_audit_log(
        db, current_user.id, "prediction_triggered", "prediction",
        entity_id=body.student_id,
        metadata={"model_version": result["model_version"]},
    )
    await db.commit()
    return result


@router.post("/predict/batch")
async def predict_batch(
    body: BatchPredictionRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    if len(body.student_ids) > 500:
        raise HTTPException(status_code=400, detail="Batch limit is 500 students")

    job_id = f"batch_{uuid.uuid4().hex[:8]}"

    async def _run_batch():
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as batch_db:
            for sid in body.student_ids:
                try:
                    await run_prediction_for_student(batch_db, sid)
                    await batch_db.commit()
                except Exception as e:
                    logger.error("Batch prediction failed for student_id=%s: %s", sid, e, exc_info=True)

    background_tasks.add_task(_run_batch)
    return {"job_id": job_id, "count": len(body.student_ids), "status": "processing"}


@router.post("/predict/simulate")
async def simulate_prediction(
    body: SimulateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    sys_settings = await get_system_settings(db)
    engine = get_engine()
    engine.update_thresholds(
        sys_settings.placement_gpa_floor,
        sys_settings.placement_attendance_floor,
        sys_settings.placement_reward_floor,
        sys_settings.placement_activity_floor,
    )

    features = {
        "attendance_pct": body.attendance_pct,
        "gpa": body.gpa,
        "reward_points": body.reward_points,
        "activity_points": body.activity_points,
    }

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, engine.predict, 0, features)
    return result


@router.post("/train")
async def train_model(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    # Gather all performance records for training
    result = await db.execute(
        select(PerformanceRecord, Prediction)
        .outerjoin(
            Prediction,
            (Prediction.student_id == PerformanceRecord.student_id),
        )
    )

    # Build training data from performance records
    all_perf = await db.execute(select(PerformanceRecord))
    records = all_perf.scalars().all()

    if len(records) < 10:
        raise HTTPException(
            status_code=400,
            detail="Insufficient training data (need at least 10 performance records)"
        )

    job_id = f"train_{uuid.uuid4().hex[:8]}"

    async def _run_training():
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as train_db:
            try:
                all_r = await train_db.execute(select(PerformanceRecord))
                recs = all_r.scalars().all()

                rows = []
                for r in recs:
                    risk_level = _assign_risk(r.attendance_pct, r.gpa)
                    rows.append({
                        "attendance_pct": r.attendance_pct,
                        "gpa": r.gpa,
                        "reward_points": r.reward_points,
                        "activity_points": r.activity_points,
                        "risk_level": risk_level,
                    })

                df = pd.DataFrame(rows)
                engine = get_engine()

                loop = asyncio.get_event_loop()
                version_id = await loop.run_in_executor(None, engine.train, df)

                await write_audit_log(
                    train_db, None, "model_trained", "model_registry",
                    metadata={"version_id": version_id, "job_id": job_id}
                )
                await train_db.commit()
            except Exception as e:
                logger.error("Model training failed job_id=%s: %s", job_id, e, exc_info=True)

    background_tasks.add_task(_run_training)
    return {"job_id": job_id, "status": "training_started"}


def _assign_risk(attendance_pct: float, gpa: float) -> str:
    """Heuristic risk assignment for training data generation."""
    if attendance_pct >= 85 and gpa >= 7.0:
        return "Low"
    elif attendance_pct >= 70 and gpa >= 5.0:
        return "Medium"
    else:
        return "High"


@router.get("/model/info")
async def get_model_info(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    engine = get_engine()
    info = engine.get_model_info()
    if not info:
        return {"status": "no_active_model"}
    return info


@router.get("/health")
async def ml_health(
    db: AsyncSession = Depends(get_db),
):
    engine = get_engine()
    return {
        "engine_ready": engine.is_ready(),
        "active_version": engine.registry.get_active_version(),
        "status": "healthy" if engine.is_ready() else "no_model",
    }


@router.get("/versions")
async def list_versions(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = AdminUser,
):
    engine = get_engine()
    return engine.list_versions()
