import uuid
from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.inscricao import InscricaoModel
from app.repositories.inscricao_repository import InscricaoRepository
from app.repositories.evento_repository import EventoRepository
from app.schemas.inscricao import InscricaoResponse


def _serialize_inscricao(insc: InscricaoModel) -> InscricaoResponse:
    return InscricaoResponse(
        id=insc.id_inscricao,
        evento_id=insc.id_evento,
        aluno_id=insc.id_usuario,
        aluno_nome=insc.usuario.nome,
        aluno_area=insc.usuario.curso.nome_curso if insc.usuario.curso else None,
        aluno_matricula=insc.usuario.username,
        data_inscricao=insc.data_inscricao,
        presenca_confirmada=insc.presenca is not None,
        qr_code=insc.qr_code_usuario,
    )


def enroll(id_evento: str, id_usuario: str, db: Session) -> InscricaoResponse:
    evento_repo = EventoRepository(db)
    evento = evento_repo.get_by_id(id_evento)

    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")

    if evento.data_limite_inscricao and date.today() > evento.data_limite_inscricao:
        raise HTTPException(status_code=400, detail="Prazo de inscricao encerrado.")

    insc_repo = InscricaoRepository(db)
    existing = insc_repo.get_by_user_and_event(id_usuario, id_evento)
    if existing:
        raise HTTPException(status_code=409, detail="Voce ja esta inscrito neste evento.")

    if evento.vagas is not None:
        count = evento_repo.count_inscricoes(id_evento)
        if count >= evento.vagas:
            raise HTTPException(status_code=409, detail="Nao ha vagas disponiveis.")

    qr_code = str(uuid.uuid4())

    inscricao = InscricaoModel(
        id_evento=id_evento,
        id_usuario=id_usuario,
        qr_code_usuario=qr_code,
    )

    inscricao = insc_repo.create(inscricao)

    inscricao = insc_repo.get_by_user_and_event(id_usuario, id_evento)
    return _serialize_inscricao(inscricao)


def get_my_enrollment(id_evento: str, id_usuario: str, db: Session) -> InscricaoResponse | None:
    repo = InscricaoRepository(db)
    insc = repo.get_by_user_and_event(id_usuario, id_evento)
    if not insc:
        return None
    return _serialize_inscricao(insc)


def list_enrollments(id_evento: str, db: Session) -> list[InscricaoResponse]:
    repo = InscricaoRepository(db)
    inscricoes = repo.list_by_event(id_evento)
    return [_serialize_inscricao(i) for i in inscricoes]
