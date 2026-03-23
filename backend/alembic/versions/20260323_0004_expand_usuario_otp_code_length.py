"""expand usuario otp_code length

Revision ID: 20260323_0004
Revises: 20260323_0003
Create Date: 2026-03-23 00:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260323_0004"
down_revision = "20260323_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "usuario",
        "otp_code",
        existing_type=sa.String(length=6),
        type_=sa.String(length=255),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "usuario",
        "otp_code",
        existing_type=sa.String(length=255),
        type_=sa.String(length=6),
        existing_nullable=True,
    )
