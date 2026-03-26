from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from datetime import datetime


class InscricaoResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    evento_id: str
    aluno_id: str
    aluno_nome: str
    aluno_area: str | None = None
    aluno_matricula: str
    data_inscricao: datetime
    presenca_confirmada: bool = False
    qr_code: str | None = None


class PresencaConfirmRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    qr_code: str


class PresencaConfirmResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sucesso: bool
    mensagem: str
    inscricao: InscricaoResponse | None = None
