from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    model_version = Column(String(50), nullable=False)
    model_type = Column(SAEnum("random_forest", "decision_tree", name="model_type_enum"), nullable=False)
    risk_level = Column(SAEnum("Low", "Medium", "High", name="risk_level_enum"), nullable=False)
    confidence = Column(Float, nullable=False)
    confidence_tier = Column(SAEnum("HIGH", "MEDIUM", "LOW", name="confidence_tier_enum"), nullable=False)
    placement_eligible = Column(Boolean, nullable=False)
    prob_low = Column(Float, nullable=True)
    prob_medium = Column(Float, nullable=True)
    prob_high = Column(Float, nullable=True)
    features_snapshot = Column(JSON, nullable=False)
    top_factors = Column(JSON, nullable=False)
    explanation = Column(Text, nullable=False)
    sync_status = Column(
        SAEnum("pending", "processing", "complete", "failed", name="sync_status_enum"),
        default="pending",
        nullable=False,
    )
    predicted_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="predictions")
