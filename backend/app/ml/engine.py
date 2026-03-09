"""
AAIE Academic Insight ML Engine
Implements: ModelRegistry, ModelManager, ModelTrainer, RiskPredictor, AcademicInsightEngine
"""

import os
import json
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import make_scorer, recall_score

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent / "models"
BASE_DIR.mkdir(parents=True, exist_ok=True)
REGISTRY_PATH = BASE_DIR / "registry.json"

FEATURE_NAMES = ["attendance_pct", "gpa", "reward_points", "activity_points"]
RISK_LABELS = ["Low", "Medium", "High"]


# ──────────────────────────────────────────────────────────────────────────────
# ModelRegistry
# ──────────────────────────────────────────────────────────────────────────────
class ModelRegistry:
    def __init__(self):
        self._path = REGISTRY_PATH
        self._data: dict = self._load()

    def _load(self) -> dict:
        if self._path.exists():
            with open(self._path, "r") as f:
                return json.load(f)
        return {"versions": {}, "active_version": None}

    def _save(self) -> None:
        with open(self._path, "w") as f:
            json.dump(self._data, f, indent=2, default=str)

    def register(self, version_id: str, metadata: dict) -> None:
        self._data["versions"][version_id] = {
            "version_id": version_id,
            "is_active": False,
            **metadata,
        }
        self._save()
        logger.info(f"Registered model version: {version_id}")

    def promote(self, version_id: str) -> None:
        if version_id not in self._data["versions"]:
            raise ValueError(f"Version {version_id} not found in registry")
        for vid in self._data["versions"]:
            self._data["versions"][vid]["is_active"] = False
        self._data["versions"][version_id]["is_active"] = True
        self._data["versions"][version_id]["promoted_at"] = datetime.now(timezone.utc).isoformat()
        self._data["active_version"] = version_id
        self._save()
        logger.info(f"Promoted model version: {version_id}")

    def get_active_version(self) -> Optional[str]:
        return self._data.get("active_version")

    def get_active_metadata(self) -> Optional[dict]:
        av = self.get_active_version()
        if not av:
            return None
        return self._data["versions"].get(av)

    def list_versions(self) -> list[dict]:
        return list(self._data["versions"].values())

    def get_version_metadata(self, version_id: str) -> Optional[dict]:
        return self._data["versions"].get(version_id)


# ──────────────────────────────────────────────────────────────────────────────
# ModelManager
# ──────────────────────────────────────────────────────────────────────────────
class ModelManager:
    def __init__(self, registry: ModelRegistry):
        self._registry = registry
        self._loaded_version: Optional[str] = None
        self._bundle: Optional[dict] = None

    def get_model(self) -> dict:
        active = self._registry.get_active_version()
        if active is None:
            raise RuntimeError("No active model version found. Please train a model first.")
        if active != self._loaded_version:
            self._load_model(active)
        return self._bundle

    def _load_model(self, version_id: str) -> None:
        meta = self._registry.get_version_metadata(version_id)
        if not meta:
            raise RuntimeError(f"No metadata for version {version_id}")
        artifact_path = meta.get("artifact_path")
        if not artifact_path or not Path(artifact_path).exists():
            raise RuntimeError(f"Artifact not found: {artifact_path}")
        self._bundle = joblib.load(artifact_path)
        self._loaded_version = version_id
        logger.info(f"Loaded model version: {version_id}")


# ──────────────────────────────────────────────────────────────────────────────
# ModelTrainer
# ──────────────────────────────────────────────────────────────────────────────
class ModelTrainer:
    def __init__(self, registry: ModelRegistry):
        self._registry = registry

    def train(self, df: pd.DataFrame) -> str:
        X = df[FEATURE_NAMES].values
        y = df["risk_level"].values

        le = LabelEncoder()
        le.classes_ = np.array(RISK_LABELS)
        y_enc = le.transform(y)

        scaler = RobustScaler()
        X_scaled = scaler.fit_transform(X)

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

        rf = RandomForestClassifier(
            n_estimators=100, max_depth=6, class_weight="balanced", random_state=42
        )
        dt = DecisionTreeClassifier(
            max_depth=5, class_weight="balanced", random_state=42
        )

        macro_recall_scorer = make_scorer(recall_score, average="macro")

        rf_scores = cross_validate(rf, X_scaled, y_enc, cv=cv, scoring={"macro_recall": macro_recall_scorer, "accuracy": "accuracy"})
        dt_scores = cross_validate(dt, X_scaled, y_enc, cv=cv, scoring={"macro_recall": macro_recall_scorer, "accuracy": "accuracy"})

        rf_recall = float(np.mean(rf_scores["test_macro_recall"]))
        dt_recall = float(np.mean(dt_scores["test_macro_recall"]))
        rf_acc = float(np.mean(rf_scores["test_accuracy"]))
        dt_acc = float(np.mean(dt_scores["test_accuracy"]))

        logger.info(f"RF macro_recall={rf_recall:.4f}, DT macro_recall={dt_recall:.4f}")

        if rf_recall >= dt_recall:
            winner = rf
            winner.fit(X_scaled, y_enc)
            model_type = "random_forest"
            winner_recall = rf_recall
            winner_acc = rf_acc
        else:
            winner = dt
            winner.fit(X_scaled, y_enc)
            model_type = "decision_tree"
            winner_recall = dt_recall
            winner_acc = dt_acc

        version_id = f"{model_type}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        artifact_path = str(BASE_DIR / f"{version_id}.joblib")

        bundle = {
            "model": winner,
            "scaler": scaler,
            "label_encoder": le,
            "model_type": model_type,
            "version_id": version_id,
            "features": FEATURE_NAMES,
        }
        joblib.dump(bundle, artifact_path)

        metadata = {
            "model_type": model_type,
            "artifact_path": artifact_path,
            "accuracy": winner_acc,
            "macro_recall": winner_recall,
            "features": FEATURE_NAMES,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "is_active": False,
        }
        self._registry.register(version_id, metadata)

        # Auto-promote if better than current active or no active model
        active_meta = self._registry.get_active_metadata()
        if active_meta is None or winner_recall > active_meta.get("macro_recall", 0):
            self._registry.promote(version_id)
            logger.info(f"Auto-promoted {version_id}")

        return version_id


# ──────────────────────────────────────────────────────────────────────────────
# RiskPredictor
# ──────────────────────────────────────────────────────────────────────────────
class RiskPredictor:
    def __init__(self, manager: ModelManager, registry: ModelRegistry):
        self._manager = manager
        self._registry = registry
        self._placement_gpa_floor = 6.0
        self._placement_attendance_floor = 75.0

    def update_thresholds(self, gpa_floor: float, attendance_floor: float) -> None:
        self._placement_gpa_floor = gpa_floor
        self._placement_attendance_floor = attendance_floor

    def predict(self, student_id: int, features_dict: dict) -> dict:
        bundle = self._manager.get_model()
        model = bundle["model"]
        scaler = bundle["scaler"]
        le = bundle["label_encoder"]
        model_type = bundle["model_type"]
        version_id = bundle["version_id"]

        # Build feature vector in correct order
        feature_vector = np.array([[features_dict[f] for f in FEATURE_NAMES]], dtype=float)
        X_scaled = scaler.transform(feature_vector)

        pred_enc = model.predict(X_scaled)[0]
        proba = model.predict_proba(X_scaled)[0]

        risk_level = le.inverse_transform([pred_enc])[0]
        confidence = float(np.max(proba))

        # Map proba to labels
        classes = le.classes_
        prob_map = {cls: float(proba[i]) for i, cls in enumerate(classes)}
        prob_low = prob_map.get("Low", 0.0)
        prob_medium = prob_map.get("Medium", 0.0)
        prob_high = prob_map.get("High", 0.0)

        # Confidence tier
        if confidence >= 0.80:
            confidence_tier = "HIGH"
        elif confidence >= 0.60:
            confidence_tier = "MEDIUM"
        else:
            confidence_tier = "LOW"

        # Placement eligibility
        gpa = features_dict.get("gpa", 0)
        attendance = features_dict.get("attendance_pct", 0)
        placement_eligible = (
            gpa >= self._placement_gpa_floor
            and attendance >= self._placement_attendance_floor
            and risk_level != "High"
        )

        # Top factors (feature importances if RF, else absolute feature values scaled)
        top_factors = self._compute_top_factors(model, model_type, X_scaled[0], features_dict)

        # Explanation
        explanation = self._build_explanation(risk_level, features_dict, top_factors)

        return {
            "prediction_id": str(uuid.uuid4()),
            "student_id": student_id,
            "model_version": version_id,
            "model_type": model_type,
            "predicted_at": datetime.now(timezone.utc).isoformat(),
            "risk_level": risk_level,
            "confidence": confidence,
            "confidence_tier": confidence_tier,
            "placement_eligible": placement_eligible,
            "probability_breakdown": {
                "Low": prob_low,
                "Medium": prob_medium,
                "High": prob_high,
            },
            "prob_low": prob_low,
            "prob_medium": prob_medium,
            "prob_high": prob_high,
            "top_factors": top_factors,
            "explanation": explanation,
            "features_used": features_dict,
        }

    def _compute_top_factors(
        self, model, model_type: str, X_scaled: np.ndarray, features_dict: dict
    ) -> list[dict]:
        try:
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
            else:
                # Fallback: use absolute scaled values as proxy
                importances = np.abs(X_scaled)

            factors = [
                {"feature": FEATURE_NAMES[i], "importance": float(importances[i])}
                for i in range(len(FEATURE_NAMES))
            ]
            factors.sort(key=lambda x: x["importance"], reverse=True)
            return factors[:3]
        except Exception:
            return [{"feature": f, "importance": 0.25} for f in FEATURE_NAMES[:3]]

    def _build_explanation(
        self, risk_level: str, features: dict, top_factors: list[dict]
    ) -> str:
        feature_display = {
            "attendance_pct": f"attendance ({features.get('attendance_pct', 0):.1f}%)",
            "gpa": f"GPA ({features.get('gpa', 0):.2f})",
            "reward_points": f"reward points ({features.get('reward_points', 0)})",
            "activity_points": f"activity points ({features.get('activity_points', 0)})",
        }
        factor_texts = [feature_display.get(f["feature"], f["feature"]) for f in top_factors]
        factors_str = ", ".join(factor_texts)
        return f"Flagged as {risk_level} risk primarily due to {factors_str}."

    def predict_batch(self, students: list[dict]) -> list[dict]:
        return [self.predict(s["student_id"], s["features"]) for s in students]


# ──────────────────────────────────────────────────────────────────────────────
# AcademicInsightEngine (Facade / Singleton)
# ──────────────────────────────────────────────────────────────────────────────
class AcademicInsightEngine:
    def __init__(self):
        self.registry = ModelRegistry()
        self.manager = ModelManager(self.registry)
        self.trainer = ModelTrainer(self.registry)
        self.predictor = RiskPredictor(self.manager, self.registry)

    def train(self, df: pd.DataFrame) -> str:
        return self.trainer.train(df)

    def predict(self, student_id: int, features: dict) -> dict:
        return self.predictor.predict(student_id, features)

    def predict_batch(self, students: list[dict]) -> list[dict]:
        return self.predictor.predict_batch(students)

    def promote(self, version_id: str) -> None:
        self.registry.promote(version_id)
        # Force model hot-reload
        self.manager._loaded_version = None

    def get_model_info(self) -> Optional[dict]:
        return self.registry.get_active_metadata()

    def list_versions(self) -> list[dict]:
        return self.registry.list_versions()

    def update_thresholds(self, gpa_floor: float, attendance_floor: float) -> None:
        self.predictor.update_thresholds(gpa_floor, attendance_floor)

    def is_ready(self) -> bool:
        return self.registry.get_active_version() is not None


_engine_instance: Optional[AcademicInsightEngine] = None


def get_engine() -> AcademicInsightEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = AcademicInsightEngine()
    return _engine_instance
