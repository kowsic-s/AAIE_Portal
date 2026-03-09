from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    staff_id = Column(Integer, ForeignKey("staff_profiles.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    type = Column(
        SAEnum(
            "counselling",
            "academic_support",
            "warning_letter",
            "parent_meeting",
            "peer_mentoring",
            name="intervention_type_enum",
        ),
        nullable=False,
    )
    description = Column(Text, nullable=False)
    status = Column(
        SAEnum("open", "in_progress", "closed", name="intervention_status_enum"),
        default="open",
        nullable=False,
    )
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    staff = relationship("StaffProfile", back_populates="interventions")
    student = relationship("Student", back_populates="interventions")
