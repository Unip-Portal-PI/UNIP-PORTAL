"""add tipo to evento_cancelamento_aviso

Revision ID: 20260422_0018
Revises: 20260416_0017
Create Date: 2026-04-22 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text


revision = "20260422_0018"
down_revision = "20260416_0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {col["name"] for col in inspect(bind).get_columns("evento_cancelamento_aviso")}

    if "tipo" not in columns:
        op.add_column(
            "evento_cancelamento_aviso",
            sa.Column(
                "tipo",
                sa.String(length=20),
                nullable=False,
                server_default=text("'cancelamento'"),
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    columns = {col["name"] for col in inspect(bind).get_columns("evento_cancelamento_aviso")}

    if "tipo" in columns:
        op.drop_column("evento_cancelamento_aviso", "tipo")
