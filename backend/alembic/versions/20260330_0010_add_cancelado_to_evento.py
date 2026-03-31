"""add cancelado flag to evento

Revision ID: 20260330_0010
Revises: 20260329_0009
Create Date: 2026-03-30 00:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260330_0010"
down_revision = "20260329_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("evento")}

    if "cancelado" not in columns:
        op.add_column(
            "evento",
            sa.Column(
                "cancelado",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("evento")}

    if "cancelado" in columns:
        op.drop_column("evento", "cancelado")
