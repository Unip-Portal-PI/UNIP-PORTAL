"""add responsavel to evento

Revision ID: 20260407_0014
Revises: 20260402_0013
Create Date: 2026-04-07 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260407_0014"
down_revision = "20260402_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {col["name"] for col in inspect(bind).get_columns("evento")}

    if "responsavel" not in columns:
        op.add_column(
            "evento",
            sa.Column("responsavel", sa.String(200), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    columns = {col["name"] for col in inspect(bind).get_columns("evento")}

    if "responsavel" in columns:
        op.drop_column("evento", "responsavel")
