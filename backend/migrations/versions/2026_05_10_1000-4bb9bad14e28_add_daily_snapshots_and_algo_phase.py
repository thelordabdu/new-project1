"""add daily_snapshots table and algo_phase column

Revision ID: 4bb9bad14e28
Revises: d15dee848b33

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "4bb9bad14e28"
down_revision: Union[str, None] = "d15dee848b33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "algo_phase",
            sa.Text(),
            nullable=False,
            server_default="whoop_primary",
        ),
    )

    op.create_table(
        "daily_snapshots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        # Whoop API values (Phase 1 source of truth)
        sa.Column("api_recovery_score", sa.Float(), nullable=True),
        sa.Column("api_hrv_rmssd", sa.Float(), nullable=True),
        sa.Column("api_resting_hr", sa.Float(), nullable=True),
        sa.Column("api_strain", sa.Float(), nullable=True),
        sa.Column("api_sleep_score", sa.Float(), nullable=True),
        sa.Column("api_sleep_duration_hrs", sa.Float(), nullable=True),
        # Our computed values (populated when algo runs)
        sa.Column("our_recovery_score", sa.Float(), nullable=True),
        sa.Column("our_hrv_rmssd", sa.Float(), nullable=True),
        sa.Column("our_resting_hr", sa.Float(), nullable=True),
        sa.Column("our_strain", sa.Float(), nullable=True),
        sa.Column("our_sleep_score", sa.Float(), nullable=True),
        # Comparator output (populated by nightly diff job)
        sa.Column("delta_recovery", sa.Float(), nullable=True),
        sa.Column("delta_hrv", sa.Float(), nullable=True),
        sa.Column("delta_strain", sa.Float(), nullable=True),
        sa.Column("delta_sleep", sa.Float(), nullable=True),
        sa.Column("within_threshold", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("our_algo_version", sa.Text(), nullable=True),
        # Migration tracking
        sa.Column("flagged_for_review", sa.Boolean(), nullable=False, server_default=sa.false()),
        # Raw API responses for audit trail
        sa.Column("raw_whoop_recovery", JSONB(), nullable=True),
        sa.Column("raw_whoop_sleep", JSONB(), nullable=True),
        sa.Column("raw_whoop_workout", JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "date", name="uq_daily_snapshots_user_date"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_daily_snapshots_user_date", "daily_snapshots", ["user_id", "date"])


def downgrade() -> None:
    op.drop_index("ix_daily_snapshots_user_date", table_name="daily_snapshots")
    op.drop_table("daily_snapshots")
    op.drop_column("user", "algo_phase")
