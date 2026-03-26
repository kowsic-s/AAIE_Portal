from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy.sql import func
from app.database import Base


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version_id = Column(String(80), unique=True, nullable=False)
    model_type = Column(
        SAEnum("random_forest", "decision_tree", name="registry_model_type_enum"),
        nullable=False,
    )
    accuracy = Column(Float, nullable=True)
    macro_recall = Column(Float, nullable=True)
    is_active = Column(Boolean, default=False, nullable=False)
    artifact_path = Column(String(255), nullable=True)
    trained_at = Column(DateTime, nullable=True)
    promoted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    high_risk_threshold = Column(Float, default=0.65, nullable=False)
    medium_risk_threshold = Column(Float, default=0.40, nullable=False)
    attendance_weight = Column(Float, default=0.35, nullable=False)
    gpa_weight = Column(Float, default=0.40, nullable=False)
    reward_weight = Column(Float, default=0.15, nullable=False)
    activity_weight = Column(Float, default=0.10, nullable=False)
    placement_gpa_floor = Column(Float, default=6.0, nullable=False)
    placement_attendance_floor = Column(Float, default=75.0, nullable=False)
    placement_reward_floor = Column(Float, default=30.0, nullable=False)
    placement_activity_floor = Column(Float, default=20.0, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
