"""add location challenges

Revision ID: f4e9d8c7b6a5
Revises: d19f49711421
Create Date: 2026-10-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "f4e9d8c7b6a5"
down_revision = "d19f49711421"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "location_challenges",
        sa.Column("challenge_id", sa.String(length=36), nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=False),
        sa.Column("branch_id", sa.Integer(), nullable=True),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("distance", sa.Float(), nullable=True),
        sa.Column("allowed_radius", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.branch_id"]),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.employee_id"]),
        sa.PrimaryKeyConstraint("challenge_id"),
    )
    op.create_index(
        "ix_location_challenges_employee_id",
        "location_challenges",
        ["employee_id"],
    )
    op.create_index(
        "ix_location_challenges_expires_at",
        "location_challenges",
        ["expires_at"],
    )
    op.create_index(
        "ix_location_challenges_status",
        "location_challenges",
        ["status"],
    )


def downgrade():
    op.drop_index(
        "ix_location_challenges_status",
        table_name="location_challenges",
    )
    op.drop_index(
        "ix_location_challenges_expires_at",
        table_name="location_challenges",
    )
    op.drop_index(
        "ix_location_challenges_employee_id",
        table_name="location_challenges",
    )
    op.drop_table("location_challenges")
