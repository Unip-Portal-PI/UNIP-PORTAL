"""seed curso Total

Revision ID: 20260416_0016
Revises: 20260407_0015
Create Date: 2026-04-16 00:00:00
"""

from alembic import op
from sqlalchemy import text


revision = "20260416_0016"
down_revision = "20260407_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        text("""
            INSERT INTO curso (id_curso, nome_curso, data_criacao, data_atualizacao)
            SELECT UUID(), 'Total', NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM curso WHERE nome_curso = 'Total'
            )
        """)
    )


def downgrade() -> None:
    op.execute(text("DELETE FROM curso WHERE nome_curso = 'Total'"))
