"""add users and comunicados support

Revision ID: 20260322_0001
Revises:
Create Date: 2026-03-22 00:00:01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260322_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    usuario_columns = {column["name"] for column in inspector.get_columns("usuario")}
    usuario_fks = {fk["name"] for fk in inspector.get_foreign_keys("usuario")}

    if "foto_url" not in usuario_columns:
        op.add_column("usuario", sa.Column("foto_url", sa.Text(), nullable=True))
    if "id_criador" not in usuario_columns:
        op.add_column("usuario", sa.Column("id_criador", sa.String(length=36), nullable=True))
    if "deleted_at" not in usuario_columns:
        op.add_column("usuario", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    if "fk_usuario_criador" not in usuario_fks:
        op.create_foreign_key(
            "fk_usuario_criador",
            "usuario",
            "usuario",
            ["id_criador"],
            ["id_usuario"],
        )

    if "comunicado" not in inspector.get_table_names():
        op.create_table(
            "comunicado",
            sa.Column("id_comunicado", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("titulo", sa.String(length=200), nullable=False),
            sa.Column("assunto", sa.String(length=120), nullable=True),
            sa.Column("conteudo", sa.Text(), nullable=False),
            sa.Column("resumo", sa.String(length=200), nullable=False),
            sa.Column("banner_url", sa.Text(), nullable=True),
            sa.Column("visibilidade", sa.JSON(), nullable=False),
            sa.Column("anexos", sa.JSON(), nullable=False),
            sa.Column("data_validade", sa.Date(), nullable=True),
            sa.Column("id_criador", sa.String(length=36), nullable=False),
            sa.Column("removido", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.Column("data_atualizacao", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["id_criador"], ["usuario.id_usuario"]),
            sa.PrimaryKeyConstraint("id_comunicado"),
            mysql_charset="utf8mb4",
            mysql_collate="utf8mb4_general_ci",
        )


def downgrade() -> None:
    op.drop_table("comunicado")
    op.drop_constraint("fk_usuario_criador", "usuario", type_="foreignkey")
    op.drop_column("usuario", "deleted_at")
    op.drop_column("usuario", "id_criador")
    op.drop_column("usuario", "foto_url")
