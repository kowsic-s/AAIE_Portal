"""Student router — personal academic data (token-scoped, no student_id param)."""

import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.middleware.rbac import require_role, CurrentUser
from app.models.student import Student
from app.models.performance import PerformanceRecord
from app.models.prediction import Prediction
from app.models.intervention import Intervention
from app.models.recommendation import Recommendation
from app.models.settings import SystemSettings
from app.schemas.student import WhatIfRequest
from app.services.prediction_service import get_latest_prediction, get_system_settings
from app.services.gemini_service import get_gemini_service
from app.ml.engine import get_engine
from app.config import get_settings as cfg

router = APIRouter(prefix="/student", tags=["student"])
StudentUser = Depends(require_role("student"))


async def _get_student(db: AsyncSession, user_id: int) -> Student:
    result = await db.execute(select(Student).where(Student.user_id == user_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/dashboard")
async def student_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StudentUser,
):
    student = await _get_student(db, current_user.id)
    pred = await get_latest_prediction(db, student.id)

    latest_perf = await db.execute(
        select(PerformanceRecord)
        .where(PerformanceRecord.student_id == student.id)
        .order_by(desc(PerformanceRecord.recorded_at))
        .limit(1)
    )
    perf = latest_perf.scalar_one_or_none()

    risk_message = {
        "High": "Your academics need immediate attention. Let's work on this.",
        "Medium": "You're making progress. A few improvements will help.",
        "Low": "Great work! Keep maintaining this performance.",
    }

    return {
        "student": {
            "id": student.id,
            "name": current_user.name,
            "email": current_user.email,
            "student_code": student.student_code,
            "batch_year": student.batch_year,
        },
        "latest_performance": {
            "attendance_pct": perf.attendance_pct if perf else None,
            "gpa": perf.gpa if perf else None,
            "reward_points": perf.reward_points if perf else None,
            "activity_points": perf.activity_points if perf else None,
            "semester": perf.semester if perf else None,
        } if perf else None,
        "prediction": {
            "risk_level": pred.risk_level,
            "confidence": pred.confidence,
            "confidence_tier": pred.confidence_tier,
            "placement_eligible": pred.placement_eligible,
            "explanation": pred.explanation,
            "risk_message": risk_message.get(pred.risk_level, ""),
            "predicted_at": pred.predicted_at.isoformat() if pred.predicted_at else None,
        } if pred else None,
        # Backward-compatible alias used by some portal views.
        "latest_prediction": {
            "risk_level": pred.risk_level,
            "confidence": pred.confidence,
            "confidence_tier": pred.confidence_tier,
            "placement_eligible": pred.placement_eligible,
            "explanation": pred.explanation,
            "risk_message": risk_message.get(pred.risk_level, ""),
            "predicted_at": pred.predicted_at.isoformat() if pred.predicted_at else None,
        } if pred else None,
    }


@router.get("/performance")
async def student_performance(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StudentUser,
):
    student = await _get_student(db, current_user.id)

    result = await db.execute(
        select(PerformanceRecord)
        .where(PerformanceRecord.student_id == student.id)
        .order_by(PerformanceRecord.semester)
    )
    records = result.scalars().all()

    return {
        "performance_history": [
            {
                "id": r.id,
                "semester": r.semester,
                "attendance_pct": r.attendance_pct,
                "gpa": r.gpa,
                "reward_points": r.reward_points,
                "activity_points": r.activity_points,
                "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
            }
            for r in records
        ]
    }


@router.post("/what-if")
async def what_if_simulation(
    body: WhatIfRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StudentUser,
):
    student = await _get_student(db, current_user.id)
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
    result = await loop.run_in_executor(None, engine.predict, student.id, features)

    # Get current prediction for comparison
    current_pred = await get_latest_prediction(db, student.id)

    return {
        "current_risk": current_pred.risk_level if current_pred else None,
        "projected_risk": result["risk_level"],
        "current_placement_eligible": current_pred.placement_eligible if current_pred else None,
        "projected_placement_eligible": result["placement_eligible"],
        "projected_confidence": result["confidence"],
        "projected_confidence_tier": result["confidence_tier"],
        "probability_breakdown": result["probability_breakdown"],
        "explanation": result["explanation"],
        "simulated_features": features,
    }


@router.get("/recommendations")
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StudentUser,
):
    student = await _get_student(db, current_user.id)

    result = await db.execute(
        select(Recommendation)
        .where(Recommendation.student_id == student.id)
        .order_by(desc(Recommendation.generated_at))
        .limit(4)
    )
    recs = result.scalars().all()

    return {
        "recommendations": [
            {
                "id": rec.id,
                "content": rec.content,
                "generated_at": rec.generated_at.isoformat() if rec.generated_at else None,
                "model_used": rec.model_used,
            }
            for rec in recs
        ]
    }


@router.post("/recommendations/generate")
async def generate_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StudentUser,
):
    student = await _get_student(db, current_user.id)
    pred = await get_latest_prediction(db, student.id)

    if not pred:
        raise HTTPException(status_code=400, detail="No prediction available. Contact your academic advisor.")

    gemini = get_gemini_service()
    content = await gemini.generate_recommendation(
        attendance_pct=pred.features_snapshot.get("attendance_pct", 0),
        gpa=pred.features_snapshot.get("gpa", 0),
        reward_points=pred.features_snapshot.get("reward_points", 0),
        activity_points=pred.features_snapshot.get("activity_points", 0),
        risk_level=pred.risk_level,
    )

    rec = Recommendation(
        student_id=student.id,
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


@router.get("/interventions")
async def get_own_interventions(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = StudentUser,
):
    student = await _get_student(db, current_user.id)

    result = await db.execute(
        select(Intervention)
        .where(Intervention.student_id == student.id)
        .order_by(desc(Intervention.created_at))
    )
    interventions = result.scalars().all()

    return {
        "interventions": [
            {
                "id": i.id,
                "type": i.type,
                "description": i.description,
                "status": i.status,
                "closed_at": i.closed_at.isoformat() if i.closed_at else None,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in interventions
        ]
    }
