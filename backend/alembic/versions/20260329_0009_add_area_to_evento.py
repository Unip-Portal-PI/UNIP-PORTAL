"""add area column to evento

Revision ID: 20260329_0009
Revises: 20260329_0008
Create Date: 2026-03-29 01:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260329_0009"
down_revision = "20260329_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("evento")}

    if "area" not in columns:
        op.add_column("evento", sa.Column("area", sa.String(length=100), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("evento")}

    if "area" in columns:
        op.drop_column("evento", "area")
