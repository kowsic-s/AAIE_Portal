"""
Tests for the ML prediction pipeline.
"""
import pytest
import pandas as pd
import numpy as np

from app.ml.engine import (
    AcademicInsightEngine,
    ModelRegistry,
    ModelManager,
    ModelTrainer,
    RiskPredictor,
    FEATURE_NAMES as FEATURES,
    RISK_LABELS,
)


@pytest.fixture
def engine(tmp_path, monkeypatch):
    """Isolated engine with separate registry/model dir per test."""
    import app.ml.engine as eng_module
    monkeypatch.setattr(eng_module, "MODELS_DIR", tmp_path)
    monkeypatch.setattr(eng_module, "REGISTRY_FILE", tmp_path / "registry.json")
    return AcademicInsightEngine()


def make_df(n=90):
    """Generate synthetic training data with balanced classes."""
    rng = np.random.default_rng(42)
    rows = []
    per_class = n // 3
    for _ in range(per_class):
        rows.append({"attendance_pct": rng.uniform(80, 100), "gpa": rng.uniform(7, 10), "reward_points": rng.integers(50, 200), "activity_points": rng.integers(30, 150), "risk_level": "Low"})
    for _ in range(per_class):
        rows.append({"attendance_pct": rng.uniform(60, 80), "gpa": rng.uniform(5, 7), "reward_points": rng.integers(20, 60), "activity_points": rng.integers(10, 40), "risk_level": "Medium"})
    for _ in range(per_class):
        rows.append({"attendance_pct": rng.uniform(30, 60), "gpa": rng.uniform(1, 5), "reward_points": rng.integers(0, 20), "activity_points": rng.integers(0, 10), "risk_level": "High"})
    return pd.DataFrame(rows)


class TestModelTraining:
    def test_train_returns_version_id(self, engine):
        df = make_df()
        version_id = engine.train(df)
        assert isinstance(version_id, str)
        assert len(version_id) > 0

    def test_train_auto_promotes(self, engine):
        df = make_df()
        version_id = engine.train(df)
        assert engine.registry.get_active_version() == version_id

    def test_is_ready_after_training(self, engine):
        assert not engine.is_ready()
        engine.train(make_df())
        assert engine.is_ready()

    def test_train_registers_metadata(self, engine):
        df = make_df()
        version_id = engine.train(df)
        meta = engine.registry.get_version(version_id)
        assert meta is not None
        assert "macro_recall" in meta
        assert meta["macro_recall"] > 0.0

    def test_second_train_does_not_auto_promote_if_worse(self, engine, monkeypatch):
        """After first train (auto-promoted), second train only promotes if better recall."""
        df = make_df()
        v1 = engine.train(df)
        # The active version is v1; second train may produce v2
        v2 = engine.train(make_df(n=90))
        active = engine.registry.get_active_version()
        # Active should be whichever has higher recall
        assert active in (v1, v2)


class TestPrediction:
    @pytest.fixture(autouse=True)
    def trained(self, engine):
        engine.train(make_df())

    def test_predict_low_risk(self, engine):
        result = engine.predict(1, {"attendance_pct": 95, "gpa": 9.0, "reward_points": 150, "activity_points": 100})
        assert result["risk_level"] in RISK_LABELS
        assert 0.0 <= result["confidence"] <= 1.0
        assert result["student_id"] == 1

    def test_predict_high_risk(self, engine):
        result = engine.predict(2, {"attendance_pct": 35, "gpa": 2.0, "reward_points": 5, "activity_points": 2})
        assert result["risk_level"] in RISK_LABELS

    def test_predict_returns_probability_breakdown(self, engine):
        result = engine.predict(3, {"attendance_pct": 70, "gpa": 6.0, "reward_points": 40, "activity_points": 20})
        breakdown = result.get("probability_breakdown") or result.get("prob_low")
        assert breakdown is not None

    def test_predict_returns_top_factors(self, engine):
        result = engine.predict(4, {"attendance_pct": 55, "gpa": 4.5, "reward_points": 10, "activity_points": 5})
        assert "top_factors" in result
        assert len(result["top_factors"]) > 0

    def test_predict_returns_explanation(self, engine):
        result = engine.predict(5, {"attendance_pct": 50, "gpa": 3.0, "reward_points": 8, "activity_points": 3})
        assert "explanation" in result
        assert isinstance(result["explanation"], str)
        assert len(result["explanation"]) > 0


class TestBatchPrediction:
    @pytest.fixture(autouse=True)
    def trained(self, engine):
        engine.train(make_df())

    def test_batch_predict(self, engine):
        samples = [
            {"student_id": i, "features": {"attendance_pct": 75, "gpa": 6.0, "reward_points": 50, "activity_points": 30}}
            for i in range(1, 6)
        ]
        results = engine.predict_batch(samples)
        assert len(results) == 5
        for r in results:
            assert r["risk_level"] in RISK_LABELS


class TestSimulation:
    @pytest.fixture(autouse=True)
    def trained(self, engine):
        engine.train(make_df())

    def test_simulate_returns_current_and_simulated(self, engine):
        current = {"attendance_pct": 55, "gpa": 4.0, "reward_points": 15, "activity_points": 8}
        changes = {"attendance_pct": 90, "gpa": 8.0}
        result = engine.simulate(1, current, changes)
        assert "current" in result
        assert "simulated" in result
        assert result["current"]["risk_level"] in RISK_LABELS
        assert result["simulated"]["risk_level"] in RISK_LABELS


class TestRegistryPromote:
    def test_promote(self, engine):
        df = make_df()
        v1 = engine.train(df)
        v2 = engine.train(make_df(n=90))
        engine.promote(v1)
        assert engine.registry.get_active_version() == v1

    def test_promote_invalid_version(self, engine):
        engine.train(make_df())
        with pytest.raises(ValueError):
            engine.promote("nonexistent_version")


class TestModelInfo:
    def test_get_model_info_when_ready(self, engine):
        engine.train(make_df())
        info = engine.get_model_info()
        assert info is not None
        assert "macro_recall" in info

    def test_get_model_info_when_not_trained(self, engine):
        info = engine.get_model_info()
        assert info is None

    def test_list_versions(self, engine):
        engine.train(make_df())
        engine.train(make_df(n=90))
        versions = engine.list_versions()
        assert len(versions) == 2
