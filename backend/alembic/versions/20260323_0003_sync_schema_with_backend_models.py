"""sync schema with backend models

Revision ID: 20260323_0003
Revises: 20260322_0002
Create Date: 2026-03-23 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260323_0003"
down_revision = "20260322_0002"
branch_labels = None
depends_on = None


TURNOS = sa.Enum("manha", "tarde", "noite", name="turno")
TIPOS_INSCRICAO = sa.Enum("interna", "externa", name="tipoinscricao")
VISIBILIDADES = sa.Enum("publica", "privada", name="visibilidade")


def _table_exists(bind, table_name: str) -> bool:
    return table_name in set(inspect(bind).get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    return {column["name"] for column in inspect(bind).get_columns(table_name)}


def _has_unique(bind, table_name: str, columns: list[str]) -> bool:
    expected = tuple(columns)
    for constraint in inspect(bind).get_unique_constraints(table_name):
        if tuple(constraint.get("column_names") or []) == expected:
            return True
    return False


def _has_fk(
    bind,
    table_name: str,
    constrained_columns: list[str],
    referred_table: str,
    referred_columns: list[str],
) -> bool:
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


def upgrade() -> None:
    bind = op.get_bind()

    if not _table_exists(bind, "nivel_acesso"):
        op.create_table(
            "nivel_acesso",
            sa.Column("id_nivel", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("nome_perfil", sa.String(length=50), nullable=False),
            sa.Column("descricao", sa.String(length=255), nullable=True),
            sa.PrimaryKeyConstraint("id_nivel"),
            sa.UniqueConstraint("nome_perfil", name="uq_nivel_acesso_nome_perfil"),
        )

    if not _table_exists(bind, "curso"):
        op.create_table(
            "curso",
            sa.Column("id_curso", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("nome_curso", sa.String(length=100), nullable=False),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.Column("data_atualizacao", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id_curso"),
            sa.UniqueConstraint("nome_curso", name="uq_curso_nome_curso"),
        )

    if not _table_exists(bind, "sala"):
        op.create_table(
            "sala",
            sa.Column("id_sala", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("identificacao", sa.String(length=100), nullable=False),
            sa.Column("capacidade", sa.Integer(), nullable=False),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.Column("data_atualizacao", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id_sala"),
        )

    if not _table_exists(bind, "palestrante"):
        op.create_table(
            "palestrante",
            sa.Column("id_palestrante", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("nome", sa.String(length=150), nullable=False),
            sa.Column("bio", sa.String(length=500), nullable=True),
            sa.Column("instituicao", sa.String(length=150), nullable=True),
            sa.Column("foto_url", sa.String(length=500), nullable=True),
            sa.Column("ativo", sa.Boolean(), nullable=False),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.Column("data_atualizacao", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id_palestrante"),
        )

    if not _table_exists(bind, "usuario"):
        op.create_table(
            "usuario",
            sa.Column("id_usuario", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("id_nivel", sa.String(length=36), nullable=False),
            sa.Column("id_curso", sa.String(length=36), nullable=True),
            sa.Column("nome", sa.String(length=150), nullable=False),
            sa.Column("apelido", sa.String(length=100), nullable=True),
            sa.Column("username", sa.String(length=50), nullable=False),
            sa.Column("email", sa.String(length=150), nullable=False),
            sa.Column("password", sa.String(length=255), nullable=False),
            sa.Column("telefone", sa.String(length=20), nullable=True),
            sa.Column("data_nascimento", sa.Date(), nullable=True),
            sa.Column("foto_url", sa.Text(), nullable=True),
            sa.Column("ativo", sa.Boolean(), nullable=False),
            sa.Column("otp_code", sa.String(length=6), nullable=True),
            sa.Column("otp_expires_at", sa.DateTime(), nullable=True),
            sa.Column("id_criador", sa.String(length=36), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.Column("data_atualizacao", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["id_curso"], ["curso.id_curso"]),
            sa.ForeignKeyConstraint(["id_criador"], ["usuario.id_usuario"]),
            sa.ForeignKeyConstraint(["id_nivel"], ["nivel_acesso.id_nivel"]),
            sa.PrimaryKeyConstraint("id_usuario"),
            sa.UniqueConstraint("email", name="uq_usuario_email"),
            sa.UniqueConstraint("username", name="uq_usuario_username"),
        )

    if not _table_exists(bind, "evento"):
        op.create_table(
            "evento",
            sa.Column("id_evento", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("nome", sa.String(length=200), nullable=False),
            sa.Column("descricao", sa.String(length=2000), nullable=True),
            sa.Column("descricao_breve", sa.String(length=120), nullable=True),
            sa.Column("banner_url", sa.String(length=500), nullable=True),
            sa.Column("data", sa.Date(), nullable=False),
            sa.Column("horario", sa.Time(), nullable=True),
            sa.Column("turno", TURNOS, nullable=True),
            sa.Column("local", sa.String(length=255), nullable=True),
            sa.Column("vagas", sa.Integer(), nullable=True),
            sa.Column("data_limite_inscricao", sa.Date(), nullable=True),
            sa.Column("tipo_inscricao", TIPOS_INSCRICAO, nullable=False),
            sa.Column("url_externa", sa.String(length=500), nullable=True),
            sa.Column("visibilidade", VISIBILIDADES, nullable=False),
            sa.Column("id_criador", sa.String(length=36), nullable=True),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.Column("data_atualizacao", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["id_criador"], ["usuario.id_usuario"]),
            
            sa.PrimaryKeyConstraint("id_evento"),
        )

    if not _table_exists(bind, "inscricao"):
        op.create_table(
            "inscricao",
            sa.Column("id_inscricao", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("id_evento", sa.String(length=36), nullable=False),
            sa.Column("id_usuario", sa.String(length=36), nullable=False),
            sa.Column("qr_code_usuario", sa.Text(), nullable=True),
            sa.Column("data_inscricao", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["id_evento"], ["evento.id_evento"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["id_usuario"], ["usuario.id_usuario"]),
            sa.PrimaryKeyConstraint("id_inscricao"),
            sa.UniqueConstraint("id_evento", "id_usuario", name="uq_inscricao_usuario_evento"),
        )

    if not _table_exists(bind, "presenca"):
        op.create_table(
            "presenca",
            sa.Column("id_presenca", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("id_inscricao", sa.String(length=36), nullable=False),
            sa.Column("confirmado_por", sa.String(length=36), nullable=True),
            sa.Column("data_hora_registro", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["confirmado_por"], ["usuario.id_usuario"]),
            sa.ForeignKeyConstraint(["id_inscricao"], ["inscricao.id_inscricao"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id_presenca"),
            sa.UniqueConstraint("id_inscricao", name="uq_presenca_id_inscricao"),
        )

    if not _table_exists(bind, "anexo"):
        op.create_table(
            "anexo",
            sa.Column("id_anexo", sa.String(length=36), server_default=sa.text("(UUID())"), nullable=False),
            sa.Column("id_evento", sa.String(length=36), nullable=False),
            sa.Column("nome", sa.String(length=255), nullable=False),
            sa.Column("url", sa.String(length=500), nullable=False),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["id_evento"], ["evento.id_evento"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id_anexo"),
        )

    if not _table_exists(bind, "evento_curso"):
        op.create_table(
            "evento_curso",
            sa.Column("id_evento", sa.String(length=36), nullable=False),
            sa.Column("id_curso", sa.String(length=36), nullable=False),
            sa.ForeignKeyConstraint(["id_curso"], ["curso.id_curso"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["id_evento"], ["evento.id_evento"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id_evento", "id_curso"),
        )

    if not _table_exists(bind, "evento_palestrante"):
        op.create_table(
            "evento_palestrante",
            sa.Column("id_evento", sa.String(length=36), nullable=False),
            sa.Column("id_palestrante", sa.String(length=36), nullable=False),
            sa.ForeignKeyConstraint(["id_evento"], ["evento.id_evento"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["id_palestrante"], ["palestrante.id_palestrante"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id_evento", "id_palestrante"),
        )

    if not _table_exists(bind, "comunicado"):
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
            sa.Column("removido", sa.Boolean(), nullable=False),
            sa.Column("data_criacao", sa.DateTime(), nullable=False),
            sa.Column("data_atualizacao", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["id_criador"], ["usuario.id_usuario"]),
            sa.PrimaryKeyConstraint("id_comunicado"),
        )

    usuario_columns = _column_names(bind, "usuario")
    if "foto_url" not in usuario_columns:
        op.add_column("usuario", sa.Column("foto_url", sa.Text(), nullable=True))
    if "id_criador" not in usuario_columns:
        op.add_column("usuario", sa.Column("id_criador", sa.String(length=36), nullable=True))
    if "deleted_at" not in usuario_columns:
        op.add_column("usuario", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    if not _has_fk(bind, "usuario", ["id_nivel"], "nivel_acesso", ["id_nivel"]):
        op.create_foreign_key("fk_usuario_id_nivel", "usuario", "nivel_acesso", ["id_nivel"], ["id_nivel"])
    if not _has_fk(bind, "usuario", ["id_curso"], "curso", ["id_curso"]):
        op.create_foreign_key("fk_usuario_id_curso", "usuario", "curso", ["id_curso"], ["id_curso"])
    if not _has_fk(bind, "usuario", ["id_criador"], "usuario", ["id_usuario"]):
        op.create_foreign_key("fk_usuario_criador", "usuario", "usuario", ["id_criador"], ["id_usuario"])
    if not _has_unique(bind, "usuario", ["username"]):
        op.create_unique_constraint("uq_usuario_username", "usuario", ["username"])
    if not _has_unique(bind, "usuario", ["email"]):
        op.create_unique_constraint("uq_usuario_email", "usuario", ["email"])

    evento_columns = _column_names(bind, "evento")
    if "descricao_breve" not in evento_columns:
        op.add_column("evento", sa.Column("descricao_breve", sa.String(length=120), nullable=True))
    if "banner_url" not in evento_columns:
        op.add_column("evento", sa.Column("banner_url", sa.String(length=500), nullable=True))
    if "data_limite_inscricao" not in evento_columns:
        op.add_column("evento", sa.Column("data_limite_inscricao", sa.Date(), nullable=True))
    if "tipo_inscricao" not in evento_columns:
        op.add_column("evento", sa.Column("tipo_inscricao", TIPOS_INSCRICAO, nullable=False))
    if "url_externa" not in evento_columns:
        op.add_column("evento", sa.Column("url_externa", sa.String(length=500), nullable=True))
    if "visibilidade" not in evento_columns:
        op.add_column("evento", sa.Column("visibilidade", VISIBILIDADES, nullable=False))
    if "id_criador" not in evento_columns:
        op.add_column("evento", sa.Column("id_criador", sa.String(length=36), nullable=True))
    if not _has_fk(bind, "evento", ["id_criador"], "usuario", ["id_usuario"]):
        op.create_foreign_key("fk_evento_criador", "evento", "usuario", ["id_criador"], ["id_usuario"])

    inscricao_columns = _column_names(bind, "inscricao")
    if "qr_code_usuario" not in inscricao_columns:
        op.add_column("inscricao", sa.Column("qr_code_usuario", sa.Text(), nullable=True))
    else:
        qr_type = next(
            column["type"] for column in inspect(bind).get_columns("inscricao") if column["name"] == "qr_code_usuario"
        )
        if "TEXT" not in str(qr_type).upper():
            op.alter_column(
                "inscricao",
                "qr_code_usuario",
                existing_type=qr_type,
                type_=sa.Text(),
                existing_nullable=True,
            )
    if not _has_fk(bind, "inscricao", ["id_evento"], "evento", ["id_evento"]):
        op.create_foreign_key(
            "fk_inscricao_evento",
            "inscricao",
            "evento",
            ["id_evento"],
            ["id_evento"],
            ondelete="CASCADE",
        )
    if not _has_fk(bind, "inscricao", ["id_usuario"], "usuario", ["id_usuario"]):
        op.create_foreign_key("fk_inscricao_usuario", "inscricao", "usuario", ["id_usuario"], ["id_usuario"])
    if not _has_unique(bind, "inscricao", ["id_evento", "id_usuario"]):
        op.create_unique_constraint("uq_inscricao_usuario_evento", "inscricao", ["id_evento", "id_usuario"])

    presenca_columns = _column_names(bind, "presenca")
    if "confirmado_por" not in presenca_columns:
        op.add_column("presenca", sa.Column("confirmado_por", sa.String(length=36), nullable=True))
    if not _has_fk(bind, "presenca", ["id_inscricao"], "inscricao", ["id_inscricao"]):
        op.create_foreign_key(
            "fk_presenca_inscricao",
            "presenca",
            "inscricao",
            ["id_inscricao"],
            ["id_inscricao"],
            ondelete="CASCADE",
        )
    if not _has_fk(bind, "presenca", ["confirmado_por"], "usuario", ["id_usuario"]):
        op.create_foreign_key("fk_presenca_confirmado_por", "presenca", "usuario", ["confirmado_por"], ["id_usuario"])
    if not _has_unique(bind, "presenca", ["id_inscricao"]):
        op.create_unique_constraint("uq_presenca_id_inscricao", "presenca", ["id_inscricao"])

    anexo_columns = _column_names(bind, "anexo")
    if "id_evento" not in anexo_columns:
        op.add_column("anexo", sa.Column("id_evento", sa.String(length=36), nullable=False))
    if not _has_fk(bind, "anexo", ["id_evento"], "evento", ["id_evento"]):
        op.create_foreign_key(
            "fk_anexo_evento",
            "anexo",
            "evento",
            ["id_evento"],
            ["id_evento"],
            ondelete="CASCADE",
        )

    comunicado_columns = _column_names(bind, "comunicado")
    if "assunto" not in comunicado_columns:
        op.add_column("comunicado", sa.Column("assunto", sa.String(length=120), nullable=True))
    if "banner_url" not in comunicado_columns:
        op.add_column("comunicado", sa.Column("banner_url", sa.Text(), nullable=True))
    if "visibilidade" not in comunicado_columns:
        op.add_column("comunicado", sa.Column("visibilidade", sa.JSON(), nullable=False))
    if "anexos" not in comunicado_columns:
        op.add_column("comunicado", sa.Column("anexos", sa.JSON(), nullable=False))
    if "data_validade" not in comunicado_columns:
        op.add_column("comunicado", sa.Column("data_validade", sa.Date(), nullable=True))
    if "removido" not in comunicado_columns:
        op.add_column("comunicado", sa.Column("removido", sa.Boolean(), nullable=False))
    if not _has_fk(bind, "comunicado", ["id_criador"], "usuario", ["id_usuario"]):
        op.create_foreign_key("fk_comunicado_criador", "comunicado", "usuario", ["id_criador"], ["id_usuario"])


def downgrade() -> None:
    pass
