"""alter evento area to json

Revision ID: 20260407_0015
Revises: 20260407_0014
Create Date: 2026-04-07 00:01:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text


revision = "20260407_0015"
down_revision = "20260407_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    col_info = {
        col["name"]: col
        for col in inspect(bind).get_columns("evento")
    }

    if "area" not in col_info:
        return

    # Converte registros com valor string simples para JSON array antes de
    # alterar o tipo da coluna, evitando quebrar dados existentes.
    bind.execute(
        text(
            "UPDATE evento "
            "SET area = JSON_ARRAY(area) "
            "WHERE area IS NOT NULL AND JSON_VALID(area) = 0"
        )
    )

    col_type = str(col_info["area"]["type"]).upper()
    if "JSON" not in col_type:
        op.alter_column(
            "evento",
            "area",
            type_=sa.JSON,
            existing_nullable=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    col_info = {
        col["name"]: col
        for col in inspect(bind).get_columns("evento")
    }

    if "area" not in col_info:
        return

    col_type = str(col_info["area"]["type"]).upper()
    if "JSON" in col_type:
        op.alter_column(
            "evento",
            "area",
            type_=sa.String(200),
            existing_nullable=True,
        )
