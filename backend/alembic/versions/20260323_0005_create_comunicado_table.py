from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260323_0005"
down_revision = "20260323_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    table_names = set(inspector.get_table_names())

    if "usuario" in table_names and "comunicado" not in table_names:
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
            sa.ForeignKeyConstraint(["id_criador"], ["usuario.id_usuario"], name="fk_comunicado_criador"),
            sa.PrimaryKeyConstraint("id_comunicado"),
            mysql_charset="utf8mb4",
            mysql_collate="utf8mb4_general_ci",
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    table_names = set(inspector.get_table_names())

    if "comunicado" in table_names:
        op.drop_table("comunicado")