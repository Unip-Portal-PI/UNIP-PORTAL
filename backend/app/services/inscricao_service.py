from datetime import date, datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from jose import jwt

from app.core.config import settings
from app.models.inscricao import InscricaoModel
from app.repositories.inscricao_repository import InscricaoRepository
from app.repositories.evento_repository import EventoRepository
from app.schemas.inscricao import InscricaoResponse
from app.core.datetime_utils import get_now_br


def _build_qr_code_payload(id_evento: str, id_usuario: str, id_inscricao: str) -> str:
    payload = {
        "type": "event_checkin",
        "evento_id": id_evento,
        "usuario_id": id_usuario,
        "inscricao_id": id_inscricao,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


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

    # Regra: Inscrições encerram 1h30 após o início do evento
    try:
        horario = evento.horario
        if isinstance(horario, str):
            horario_time = datetime.strptime(horario, "%H:%M").time()
        else:
            horario_time = horario or datetime.strptime("00:00", "%H:%M").time()

        data_hora_evento = datetime.combine(evento.data, horario_time)
        # Agora o limite é +90 minutos (1h30) em vez de -30 minutos
        limite_inscricao = data_hora_evento + timedelta(minutes=90)
        
        if get_now_br().replace(tzinfo=None) > limite_inscricao:
            raise HTTPException(
                status_code=400, 
                detail="As inscricoes para este evento estao encerradas (limite de 1h30 apos o inicio)."
            )
    except (ValueError, TypeError):
        # Caso o formato do horário seja inválido, mantém a lógica legada de data
        if evento.data_limite_inscricao and date.today() > evento.data_limite_inscricao:
            raise HTTPException(status_code=400, detail="Prazo de inscricao encerrado.")

    if evento.data_limite_inscricao and date.today() > evento.data_limite_inscricao:
        raise HTTPException(status_code=400, detail="Prazo de inscricao encerrado.")

    insc_repo = InscricaoRepository(db)
    existing = insc_repo.get_by_user_and_event(id_usuario, id_evento)
    if existing:
        raise HTTPException(status_code=409, detail="Voce ja esta inscrito neste evento.")

    existing_same_day = insc_repo.get_by_user_and_event_date(
        id_usuario=id_usuario,
        data_evento=evento.data,
        exclude_event_id=id_evento,
    )
    if existing_same_day:
        raise HTTPException(
            status_code=409,
            detail="Voce nao pode se inscrever em mais de um evento por dia.",
        )

    if evento.vagas is not None:
        count = evento_repo.count_inscricoes(id_evento)
        if count >= evento.vagas:
            raise HTTPException(status_code=409, detail="Nao ha vagas disponiveis.")

    inscricao = InscricaoModel(
        id_evento=id_evento,
        id_usuario=id_usuario,
    )

    inscricao = insc_repo.create(inscricao)
    inscricao.qr_code_usuario = _build_qr_code_payload(
        id_evento=id_evento,
        id_usuario=id_usuario,
        id_inscricao=inscricao.id_inscricao,
    )
    inscricao = insc_repo.update(inscricao)

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


def list_my_enrollments(id_usuario: str, db: Session) -> list[InscricaoResponse]:
    repo = InscricaoRepository(db)
    inscricoes = repo.list_by_user(id_usuario)
    return [_serialize_inscricao(i) for i in inscricoes]


def cancel_enrollment(id_evento: str, id_usuario: str, db: Session) -> None:
    evento = EventoRepository(db).get_by_id(id_evento)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")

    repo = InscricaoRepository(db)
    inscricao = repo.get_by_user_and_event(id_usuario, id_evento)
    if not inscricao:
        raise HTTPException(status_code=404, detail="Inscricao nao encontrada.")

    if inscricao.presenca is not None:
        raise HTTPException(
            status_code=409,
            detail="Nao e possivel cancelar uma inscricao com presenca confirmada.",
        )

    repo.delete(inscricao)
