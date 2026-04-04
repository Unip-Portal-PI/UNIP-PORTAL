from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import date, datetime, time

from app.core.enums import Turno, TipoInscricao, Visibilidade
from app.schemas.usuario import UsuarioResumoResponse


class AnexoResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    nome: str
    url: str


class AnexoRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str | None = None
    nome: str
    url: str


class EventoResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    banner: str | None = None
    nome: str
    descricao_breve: str | None = None
    descricao_completa: str | None = None
    area: str | None = None
    data: date
    horario: time | None = None
    turno: Turno | None = None
    local: str | None = None
    data_limite_inscricao: date | None = None
    vagas: int | None = None
    vagas_ocupadas: int = 0
    tipo_inscricao: TipoInscricao = TipoInscricao.interna
    url_externa: str | None = None
    visibilidade: Visibilidade = Visibilidade.publica
    modo_edicao: Visibilidade = Visibilidade.privada
    colaboradores: list[UsuarioResumoResponse] = []
    anexos: list[AnexoResponse] = []
    criado_em: datetime | None = None
    id_criador: str | None = None


class EventoCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    nome: str
    area: str | None = None
    descricao: str | None = None
    descricao_breve: str | None = None
    banner_url: str | None = None
    data: date
    horario: time | None = None
    turno: Turno | None = None
    local: str | None = None
    vagas: int | None = None
    data_limite_inscricao: date | None = None
    tipo_inscricao: TipoInscricao = TipoInscricao.interna
    url_externa: str | None = None
    visibilidade: Visibilidade = Visibilidade.publica
    modo_edicao: Visibilidade = Visibilidade.privada
    colaboradores_ids: list[str] = []
    anexos: list[AnexoRequest] = []
    cursos_ids: list[str] = []
    palestrantes_ids: list[str] = []


class EventoUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    nome: str | None = None
    area: str | None = None
    descricao: str | None = None
    descricao_breve: str | None = None
    banner_url: str | None = None
    data: date | None = None
    horario: time | None = None
    turno: Turno | None = None
    local: str | None = None
    vagas: int | None = None
    data_limite_inscricao: date | None = None
    tipo_inscricao: TipoInscricao | None = None
    url_externa: str | None = None
    visibilidade: Visibilidade | None = None
    modo_edicao: Visibilidade | None = None
    colaboradores_ids: list[str] | None = None
    anexos: list[AnexoRequest] | None = None
    cursos_ids: list[str] | None = None
    palestrantes_ids: list[str] | None = None


class EventoCancelResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    mensagem: str
    evento_id: str
    inscricoes_canceladas: int = 0
