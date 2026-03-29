"""remove sala fk from evento and keep local as string

Revision ID: 20260329_0006
Revises: 20260323_0005
Create Date: 2026-03-29 00:00:00

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text


revision = "20260329_0006"
down_revision = "20260323_0005"
branch_labels = None
depends_on = None


def _column_names(bind, table_name: str) -> set[str]:
    return {col["name"] for col in inspect(bind).get_columns(table_name)}


def _has_fk(bind, table_name: str, constrained_columns: list, referred_table: str, referred_columns: list) -> bool:
    expected_cols = tuple(constrained_columns)
    expected_ref_cols = tuple(referred_columns)
    for fk in inspect(bind).get_foreign_keys(table_name):
        if tuple(fk.get("constrained_columns") or []) != expected_cols:
            continue
        if fk.get("referred_table") != referred_table:
            continue
        if tuple(fk.get("referred_columns") or []) != expected_ref_cols:
            continue
        return True
    return False


def _get_fk_name(bind, table_name: str, constrained_columns: list, referred_table: str) -> str | None:
    expected_cols = tuple(constrained_columns)
    for fk in inspect(bind).get_foreign_keys(table_name):
        if tuple(fk.get("constrained_columns") or []) != expected_cols:
            continue
        if fk.get("referred_table") != referred_table:
            continue
        return fk.get("name")
    return None


def upgrade() -> None:
    bind = op.get_bind()
    evento_columns = _column_names(bind, "evento")

    # 1. Remove FK de sala->local caso exista (quem rodou a 0003 antiga)
    if _has_fk(bind, "evento", ["local"], "sala", ["local"]):
        fk_name = _get_fk_name(bind, "evento", ["local"], "sala")
        if fk_name:
            op.drop_constraint(fk_name, "evento", type_="foreignkey")

    # 2. Remove FK fk_evento_sala (id_sala) caso exista
    if _has_fk(bind, "evento", ["id_sala"], "sala", ["id_sala"]):
        fk_name = _get_fk_name(bind, "evento", ["id_sala"], "sala")
        op.drop_constraint(fk_name or "fk_evento_sala", "evento", type_="foreignkey")

    # 3. Remove coluna id_sala se existir
    if "id_sala" in evento_columns:
        op.drop_column("evento", "id_sala")

    # 4. Garante que local é VARCHAR(255) simples (sem FK)
    if "local" in evento_columns:
        op.alter_column(
            "evento",
            "local",
            existing_type=sa.String(length=36),
            type_=sa.String(length=255),
            existing_nullable=True,
            nullable=True,
        )
    else:
        op.add_column("evento", sa.Column("local", sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Reversão apenas converte local de volta para String(36)
    op.alter_column(
        "evento",
        "local",
        existing_type=sa.String(length=255),
        type_=sa.String(length=36),
        existing_nullable=True,
        nullable=True,
    )
