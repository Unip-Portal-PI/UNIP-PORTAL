"""normalize evento turno enum values to lowercase

Revision ID: 20260329_0007
Revises: 20260329_0006
Create Date: 2026-03-29 00:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260329_0007"
down_revision = "20260329_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "evento",
        "turno",
        existing_type=sa.Enum("MANHA", "TARDE", "NOITE", name="turno"),
        type_=sa.String(length=20),
        existing_nullable=True,
        nullable=True,
    )

    op.execute(
        sa.text(
            """
            UPDATE evento
            SET turno = CASE
                WHEN turno = 'MANHA' THEN 'manha'
                WHEN turno = 'TARDE' THEN 'tarde'
                WHEN turno = 'NOITE' THEN 'noite'
                ELSE turno
            END
            """
        )
    )

    op.alter_column(
        "evento",
        "turno",
        existing_type=sa.String(length=20),
        type_=sa.Enum("manha", "tarde", "noite", name="turno"),
        existing_nullable=True,
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "evento",
        "turno",
        existing_type=sa.Enum("manha", "tarde", "noite", name="turno"),
        type_=sa.String(length=20),
        existing_nullable=True,
        nullable=True,
    )

    op.execute(
        sa.text(
            """
            UPDATE evento
            SET turno = CASE
                WHEN turno = 'manha' THEN 'MANHA'
                WHEN turno = 'tarde' THEN 'TARDE'
                WHEN turno = 'noite' THEN 'NOITE'
                ELSE turno
            END
            """
        )
    )

    op.alter_column(
        "evento",
        "turno",
        existing_type=sa.String(length=20),
        type_=sa.Enum("MANHA", "TARDE", "NOITE", name="turno"),
        existing_nullable=True,
        nullable=True,
    )
