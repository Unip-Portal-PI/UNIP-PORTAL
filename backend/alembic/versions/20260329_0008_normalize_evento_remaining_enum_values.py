"""normalize remaining evento enum values to lowercase

Revision ID: 20260329_0008
Revises: 20260329_0007
Create Date: 2026-03-29 00:40:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260329_0008"
down_revision = "20260329_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "evento",
        "tipo_inscricao",
        existing_type=sa.Enum("INTERNA", "EXTERNA", name="tipoinscricao"),
        type_=sa.String(length=20),
        existing_nullable=False,
        nullable=False,
    )
    op.execute(
        sa.text(
            """
            UPDATE evento
            SET tipo_inscricao = CASE
                WHEN tipo_inscricao = 'INTERNA' THEN 'interna'
                WHEN tipo_inscricao = 'EXTERNA' THEN 'externa'
                ELSE tipo_inscricao
            END
            """
        )
    )
    op.alter_column(
        "evento",
        "tipo_inscricao",
        existing_type=sa.String(length=20),
        type_=sa.Enum("interna", "externa", name="tipoinscricao"),
        existing_nullable=False,
        nullable=False,
    )

    op.alter_column(
        "evento",
        "visibilidade",
        existing_type=sa.Enum("PUBLICA", "PRIVADA", name="visibilidade"),
        type_=sa.String(length=20),
        existing_nullable=False,
        nullable=False,
    )
    op.execute(
        sa.text(
            """
            UPDATE evento
            SET visibilidade = CASE
                WHEN visibilidade = 'PUBLICA' THEN 'publica'
                WHEN visibilidade = 'PRIVADA' THEN 'privada'
                ELSE visibilidade
            END
            """
        )
    )
    op.alter_column(
        "evento",
        "visibilidade",
        existing_type=sa.String(length=20),
        type_=sa.Enum("publica", "privada", name="visibilidade"),
        existing_nullable=False,
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "evento",
        "visibilidade",
        existing_type=sa.Enum("publica", "privada", name="visibilidade"),
        type_=sa.String(length=20),
        existing_nullable=False,
        nullable=False,
    )
    op.execute(
        sa.text(
            """
            UPDATE evento
            SET visibilidade = CASE
                WHEN visibilidade = 'publica' THEN 'PUBLICA'
                WHEN visibilidade = 'privada' THEN 'PRIVADA'
                ELSE visibilidade
            END
            """
        )
    )
    op.alter_column(
        "evento",
        "visibilidade",
        existing_type=sa.String(length=20),
        type_=sa.Enum("PUBLICA", "PRIVADA", name="visibilidade"),
        existing_nullable=False,
        nullable=False,
    )

    op.alter_column(
        "evento",
        "tipo_inscricao",
        existing_type=sa.Enum("interna", "externa", name="tipoinscricao"),
        type_=sa.String(length=20),
        existing_nullable=False,
        nullable=False,
    )
    op.execute(
        sa.text(
            """
            UPDATE evento
            SET tipo_inscricao = CASE
                WHEN tipo_inscricao = 'interna' THEN 'INTERNA'
                WHEN tipo_inscricao = 'externa' THEN 'EXTERNA'
                ELSE tipo_inscricao
            END
            """
        )
    )
    op.alter_column(
        "evento",
        "tipo_inscricao",
        existing_type=sa.String(length=20),
        type_=sa.Enum("INTERNA", "EXTERNA", name="tipoinscricao"),
        existing_nullable=False,
        nullable=False,
    )
