"""create evento_colaborador table

Revision ID: 20260402_0013
Revises: 20260402_0012
Create Date: 2026-04-02 00:10:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260402_0013"
down_revision = "20260402_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())

    if "evento_colaborador" not in tables:
        op.create_table(
            "evento_colaborador",
            sa.Column("id_evento", sa.String(length=36), sa.ForeignKey("evento.id_evento", ondelete="CASCADE"), nullable=False),
            sa.Column("id_usuario", sa.String(length=36), sa.ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False),
            sa.PrimaryKeyConstraint("id_evento", "id_usuario"),
            mysql_engine="InnoDB",
            mysql_charset="utf8mb4",
            mysql_collate="utf8mb4_general_ci",
        )


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())

    if "evento_colaborador" in tables:
        op.drop_table("evento_colaborador")
