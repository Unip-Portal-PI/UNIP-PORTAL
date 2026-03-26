"""change qr_code_usuario to text

Revision ID: 20260322_0002
Revises: 20260322_0001
Create Date: 2026-03-22 00:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260322_0002"
down_revision = "20260322_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "inscricao" not in set(inspector.get_table_names()):
        return

    unique_constraints = inspector.get_unique_constraints("inscricao")
    for constraint in unique_constraints:
        columns = constraint.get("column_names") or []
        if columns == ["qr_code_usuario"] and constraint.get("name"):
            op.drop_constraint(constraint["name"], "inscricao", type_="unique")

    op.alter_column(
        "inscricao",
        "qr_code_usuario",
        existing_type=sa.String(length=255),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "inscricao" not in set(inspector.get_table_names()):
        return

    op.alter_column(
        "inscricao",
        "qr_code_usuario",
        existing_type=sa.Text(),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
    op.create_unique_constraint(
        "uq_inscricao_qr_code_usuario",
        "inscricao",
        ["qr_code_usuario"],
    )