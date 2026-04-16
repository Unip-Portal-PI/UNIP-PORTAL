"""seed curso Todos: remove Total, add Todos

Revision ID: 20260416_0017
Revises: 20260416_0016
Create Date: 2026-04-16 00:00:00
"""

from alembic import op
from sqlalchemy import text


revision = "20260416_0017"
down_revision = "20260416_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(text("DELETE FROM curso WHERE nome_curso = 'Total'"))

    op.execute(
        text("""
            INSERT INTO curso (id_curso, nome_curso, data_criacao, data_atualizacao)
            SELECT UUID(), 'Todos', NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM curso WHERE nome_curso = 'Todos'
            )
        """)
    )


def downgrade() -> None:
    op.execute(text("DELETE FROM curso WHERE nome_curso = 'Todos'"))

    op.execute(
        text("""
            INSERT INTO curso (id_curso, nome_curso, data_criacao, data_atualizacao)
            SELECT UUID(), 'Total', NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM curso WHERE nome_curso = 'Total'
            )
        """)
    )
