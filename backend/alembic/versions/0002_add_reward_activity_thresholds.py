"""Add reward/activity placement thresholds

Revision ID: 0002_reward_activity
Revises: 0001_initial
Create Date: 2026-03-26
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_reward_activity"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {c["name"] for c in inspector.get_columns("system_settings")}

    if "placement_reward_floor" not in existing_cols:
        op.add_column(
            "system_settings",
            sa.Column("placement_reward_floor", sa.Float(), nullable=False, server_default="30.0"),
        )
    if "placement_activity_floor" not in existing_cols:
        op.add_column(
            "system_settings",
            sa.Column("placement_activity_floor", sa.Float(), nullable=False, server_default="20.0"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {c["name"] for c in inspector.get_columns("system_settings")}

    if "placement_activity_floor" in existing_cols:
        op.drop_column("system_settings", "placement_activity_floor")
    if "placement_reward_floor" in existing_cols:
        op.drop_column("system_settings", "placement_reward_floor")
