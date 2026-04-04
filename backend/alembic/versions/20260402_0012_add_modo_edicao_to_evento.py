"""add modo_edicao to evento

Revision ID: 20260402_0012
Revises: 20260330_0011
Create Date: 2026-04-02 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260402_0012"
down_revision = "20260330_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("evento")}

    if "modo_edicao" not in columns:
        op.add_column(
            "evento",
            sa.Column(
                "modo_edicao",
                sa.Enum("publica", "privada", name="visibilidade"),
                nullable=False,
                server_default="privada",
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in inspect(bind).get_columns("evento")}

    if "modo_edicao" in columns:
        op.drop_column("evento", "modo_edicao")
