"""Initial schema — all AAIE tables

Revision ID: 0001_initial
Revises:
Create Date: 2026-02-27

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "staff", "student", name="user_role"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("last_login", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "departments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("student_code", sa.String(30), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("batch_year", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("student_code"),
    )

    op.create_table(
        "staff_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("employee_code", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("employee_code"),
    )

    op.create_table(
        "staff_students",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("staff_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["staff_id"], ["staff_profiles.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("staff_id", "student_id", name="uq_staff_student"),
    )

    op.create_table(
        "performance_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("attendance_pct", sa.Float(), nullable=False),
        sa.Column("gpa", sa.Float(), nullable=False),
        sa.Column("reward_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("activity_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("semester", sa.String(20), nullable=False),
        sa.Column("recorded_by", sa.Integer(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.ForeignKeyConstraint(["recorded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("model_version", sa.String(50), nullable=False),
        sa.Column("model_type", sa.Enum("random_forest", "decision_tree", name="model_type_enum"), nullable=False),
        sa.Column("risk_level", sa.Enum("Low", "Medium", "High", name="risk_level_enum"), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("confidence_tier", sa.Enum("HIGH", "MEDIUM", "LOW", name="confidence_tier_enum"), nullable=False),
        sa.Column("placement_eligible", sa.Boolean(), nullable=False),
        sa.Column("prob_low", sa.Float(), nullable=True),
        sa.Column("prob_medium", sa.Float(), nullable=True),
        sa.Column("prob_high", sa.Float(), nullable=True),
        sa.Column("features_snapshot", sa.JSON(), nullable=False),
        sa.Column("top_factors", sa.JSON(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("sync_status", sa.Enum("pending", "processing", "complete", "failed", name="sync_status_enum"), server_default="pending", nullable=False),
        sa.Column("predicted_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "interventions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("staff_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.Enum("counselling", "academic_support", "warning_letter", "parent_meeting", "peer_mentoring", name="intervention_type_enum"), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.Enum("open", "in_progress", "closed", name="intervention_status_enum"), server_default="open", nullable=False),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["staff_id"], ["staff_profiles.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("model_used", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "model_registry",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("version_id", sa.String(80), nullable=False),
        sa.Column("model_type", sa.Enum("random_forest", "decision_tree", name="registry_model_type_enum"), nullable=False),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("macro_recall", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("artifact_path", sa.String(255), nullable=True),
        sa.Column("trained_at", sa.DateTime(), nullable=True),
        sa.Column("promoted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("version_id"),
    )

    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("high_risk_threshold", sa.Float(), nullable=False, server_default="0.65"),
        sa.Column("medium_risk_threshold", sa.Float(), nullable=False, server_default="0.40"),
        sa.Column("attendance_weight", sa.Float(), nullable=False, server_default="0.35"),
        sa.Column("gpa_weight", sa.Float(), nullable=False, server_default="0.40"),
        sa.Column("reward_weight", sa.Float(), nullable=False, server_default="0.15"),
        sa.Column("activity_weight", sa.Float(), nullable=False, server_default="0.10"),
        sa.Column("placement_gpa_floor", sa.Float(), nullable=False, server_default="6.0"),
        sa.Column("placement_attendance_floor", sa.Float(), nullable=False, server_default="75.0"),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("system_settings")
    op.drop_table("model_registry")
    op.drop_table("recommendations")
    op.drop_table("interventions")
    op.drop_table("predictions")
    op.drop_table("performance_records")
    op.drop_table("staff_students")
    op.drop_table("staff_profiles")
    op.drop_table("students")
    op.drop_table("departments")
    op.drop_table("users")
