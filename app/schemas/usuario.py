from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class UsuarioBase(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    nome: str
    apelido: str | None = None
    matricula: str
    email: str
    area: str | None = None
    permission: str
    foto_url: str | None = None


class UsuarioPerfilResponse(UsuarioBase):
    telefone: str | None = None
    data_nascimento: date | None = None
    ativo: bool
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None


class UsuarioUpdateMeRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    nome: str
    apelido: str | None = None
    email: EmailStr
    telefone: str | None = None
    data_nascimento: date | None = None
    area: str


class UsuarioUpdatePasswordRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    senha_atual: str
    nova_senha: str


class UsuarioUpdatePhotoRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    foto_url: str | None = None


class UsuarioAdminCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    matricula: str
    nome: str
    apelido: str | None = None
    email: EmailStr
    senha: str
    area: str
    permission: str
    ativo: bool = True


class UsuarioAdminUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    nome: str | None = None
    apelido: str | None = None
    email: EmailStr | None = None
    area: str | None = None
    permission: str | None = None
    ativo: bool | None = None


class UsuarioAdminResponse(UsuarioBase):
    ativo: bool
    deleted_at: datetime | None = None
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    criado_por: str | None = None


class MensagemResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    mensagem: str
