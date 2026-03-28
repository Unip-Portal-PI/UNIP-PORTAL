from datetime import date, datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ComunicadoAnexoResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    nome: str
    url: str
    tipo: str
    tamanho_mb: float


class ComunicadoResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    titulo: str
    assunto: str | None = None
    conteudo: str
    resumo: str
    banner: str | None = None
    visibilidade: list[str] = []
    anexos: list[ComunicadoAnexoResponse] = []
    data_validade: date | None = None
    criado_em: datetime | None = None
    criado_por: str
    criado_por_nome: str
    removido: bool = False


class ComunicadoAnexoRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    nome: str
    url: str
    tipo: str
    tamanho_mb: float


class ComunicadoCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    titulo: str
    assunto: str | None = None
    conteudo: str
    resumo: str
    banner: str | None = None
    visibilidade: list[str] = []
    anexos: list[ComunicadoAnexoRequest] = []
    data_validade: date | None = None


class ComunicadoUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    titulo: str | None = None
    assunto: str | None = None
    conteudo: str | None = None
    resumo: str | None = None
    banner: str | None = None
    visibilidade: list[str] | None = None
    anexos: list[ComunicadoAnexoRequest] | None = None
    data_validade: date | None = None
