from pydantic import BaseModel, ConfigDict
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
