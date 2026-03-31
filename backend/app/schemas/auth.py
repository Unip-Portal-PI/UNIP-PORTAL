from pydantic import BaseModel, EmailStr, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import date


class UsuarioResumo(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    nome: str
    apelido: str | None = None
    matricula: str
    email: str
    area: str | None = None
    foto_url: str | None = None
    permission: str


class LoginRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    matricula: str
    senha: str


class EventoCanceladoResumo(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    evento_id: str
    nome: str
    data: date


class LoginResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    mensagem: str
    token: str | None = None
    usuario: UsuarioResumo | None = None
    eventos_cancelados: list[EventoCanceladoResumo] = []


class CadastroRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    matricula: str
    nome: str
    apelido: str | None = None
    telefone: str | None = None
    data_nascimento: date | None = None
    area: str
    email: EmailStr
    senha: str


class CadastroResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    mensagem: str


class ResetSolicitarRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    matricula: str
    email: EmailStr


class ResetPreviewResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    mensagem: str
    matricula: str | None = None
    email_preview: str | None = None


class ResetPreviewRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    matricula: str


class ResetValidarRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    email: EmailStr
    codigo: str


class ResetValidarResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    token_redefinicao: str


class ResetRedefinirRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    token_redefinicao: str
    nova_senha: str


class MensagemResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    mensagem: str
