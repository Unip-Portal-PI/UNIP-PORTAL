"""create evento_cancelamento_aviso table

Revision ID: 20260330_0011
Revises: 20260330_0010
Create Date: 2026-03-30 01:10:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260330_0011"
down_revision = "20260330_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())

    if "evento_cancelamento_aviso" not in tables:
        op.create_table(
            "evento_cancelamento_aviso",
            sa.Column("id_aviso", sa.String(length=36), primary_key=True, server_default=sa.text("(UUID())")),
            sa.Column("id_usuario", sa.String(length=36), sa.ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False),
            sa.Column("id_evento", sa.String(length=36), sa.ForeignKey("evento.id_evento", ondelete="CASCADE"), nullable=False),
            sa.Column("evento_nome", sa.String(length=200), nullable=False),
            sa.Column("evento_data", sa.Date(), nullable=False),
            sa.Column("criado_em", sa.DateTime(), nullable=False),
            sa.Column("visualizado_em", sa.DateTime(), nullable=True),
            mysql_engine="InnoDB",
            mysql_charset="utf8mb4",
            mysql_collate="utf8mb4_general_ci",
        )


def downgrade() -> None:
    bind = op.get_bind()
    tables = set(inspect(bind).get_table_names())

    if "evento_cancelamento_aviso" in tables:
        op.drop_table("evento_cancelamento_aviso")
