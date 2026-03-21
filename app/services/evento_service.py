from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.evento import EventoModel
from app.repositories.evento_repository import EventoRepository
from app.schemas.evento import EventoResponse, EventoCreate, EventoUpdate, AnexoResponse


def _serialize_evento(evento: EventoModel, vagas_ocupadas: int = 0) -> EventoResponse:
    area = None
    if evento.cursos:
        area = ", ".join(c.nome_curso for c in evento.cursos)

    return EventoResponse(
        id=evento.id_evento,
        banner=evento.banner_url,
        nome=evento.nome,
        descricao_breve=evento.descricao_breve,
        descricao_completa=evento.descricao,
        area=area,
        data=evento.data,
        horario=evento.horario,
        turno=evento.turno,
        local=evento.sala.identificacao if evento.sala else None,
        data_limite_inscricao=evento.data_limite_inscricao,
        vagas=evento.vagas,
        vagas_ocupadas=vagas_ocupadas,
        tipo_inscricao=evento.tipo_inscricao,
        url_externa=evento.url_externa,
        visibilidade=evento.visibilidade,
        anexos=[
            AnexoResponse(id=a.id_anexo, nome=a.nome, url=a.url)
            for a in evento.anexos
        ],
        criado_em=evento.data_criacao,
    )


def list_events(db: Session) -> list[EventoResponse]:
    repo = EventoRepository(db)
    eventos = repo.list_all()
    result = []
    for evento in eventos:
        count = repo.count_inscricoes(evento.id_evento)
        result.append(_serialize_evento(evento, count))
    return result


def get_event(evento_id: str, db: Session) -> EventoResponse:
    repo = EventoRepository(db)
    evento = repo.get_by_id(evento_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")
    count = repo.count_inscricoes(evento.id_evento)
    return _serialize_evento(evento, count)


def create_event(data: EventoCreate, criador_id: str, db: Session) -> EventoResponse:
    repo = EventoRepository(db)

    evento = EventoModel(
        nome=data.nome,
        descricao=data.descricao,
        descricao_breve=data.descricao_breve,
        banner_url=data.banner_url,
        data=data.data,
        horario=data.horario,
        turno=data.turno,
        id_sala=data.id_sala,
        vagas=data.vagas,
        data_limite_inscricao=data.data_limite_inscricao,
        tipo_inscricao=data.tipo_inscricao,
        url_externa=data.url_externa,
        visibilidade=data.visibilidade,
        id_criador=criador_id,
    )

    evento = repo.create(evento)

    if data.cursos_ids:
        repo.set_cursos(evento.id_evento, data.cursos_ids)
    if data.palestrantes_ids:
        repo.set_palestrantes(evento.id_evento, data.palestrantes_ids)

    db.commit()

    evento = repo.get_by_id(evento.id_evento)
    return _serialize_evento(evento, 0)


def update_event(evento_id: str, data: EventoUpdate, db: Session) -> EventoResponse:
    repo = EventoRepository(db)
    evento = repo.get_by_id(evento_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")

    update_data = data.model_dump(exclude_unset=True)

    cursos_ids = update_data.pop("cursos_ids", None)
    palestrantes_ids = update_data.pop("palestrantes_ids", None)

    for field, value in update_data.items():
        setattr(evento, field, value)

    if cursos_ids is not None:
        repo.set_cursos(evento.id_evento, cursos_ids)
    if palestrantes_ids is not None:
        repo.set_palestrantes(evento.id_evento, palestrantes_ids)

    repo.update(evento)

    evento = repo.get_by_id(evento_id)
    count = repo.count_inscricoes(evento_id)
    return _serialize_evento(evento, count)


def delete_event(evento_id: str, db: Session) -> None:
    repo = EventoRepository(db)
    evento = repo.get_by_id(evento_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")

    count = repo.count_inscricoes(evento_id)
    if count > 0:
        raise HTTPException(
            status_code=409,
            detail="Nao e possivel excluir evento com inscricoes ativas.",
        )

    repo.delete(evento)
