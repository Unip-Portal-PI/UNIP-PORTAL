from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.storage import build_file_url, extract_file_path
from app.models.evento import EventoModel
from app.models.evento_cancelamento_aviso import EventoCancelamentoAvisoModel
from app.models.usuario import UsuarioModel
from app.repositories.evento_repository import EventoRepository
from app.schemas.evento import (
    AnexoResponse,
    EventoCancelResponse,
    EventoCreate,
    EventoResponse,
    EventoUpdate,
    ScrollEventoResponse,
)
from app.schemas.usuario import UsuarioResumoResponse


def _normalize_anexos(anexos):
    normalized_anexos = []
    for anexo in anexos or []:
        normalized = anexo.model_dump(by_alias=False) if hasattr(anexo, "model_dump") else dict(anexo)
        normalized["url"] = extract_file_path(normalized.get("url"))
        normalized_anexos.append(normalized)
    return normalized_anexos


def _serialize_evento(evento: EventoModel, vagas_ocupadas: int = 0) -> EventoResponse:
    return EventoResponse(
        id=evento.id_evento,
        banner=build_file_url(evento.banner_url),
        nome=evento.nome,
        descricao_breve=evento.descricao_breve,
        descricao_completa=evento.descricao,
        area=evento.area or [],
        data=evento.data,
        horario=evento.horario,
        turno=evento.turno,
        local=evento.local,
        data_limite_inscricao=evento.data_limite_inscricao,
        vagas=evento.vagas,
        vagas_ocupadas=vagas_ocupadas,
        tipo_inscricao=evento.tipo_inscricao,
        url_externa=evento.url_externa,
        visibilidade=evento.visibilidade,
        modo_edicao=evento.modo_edicao,
        colaboradores=[
            UsuarioResumoResponse(
                id=user.id_usuario,
                nome=user.nome,
                apelido=user.apelido,
                matricula=user.username,
                email=user.email,
                area=user.curso.nome_curso if user.curso else None,
                permission=user.nivel_acesso.nome_perfil,
            )
            for user in evento.colaboradores
            if user.nivel_acesso.nome_perfil == "colaborador"
        ],
        anexos=[
            AnexoResponse(id=a.id_anexo, nome=a.nome, url=build_file_url(a.url) or a.url)
            for a in evento.anexos
        ],
        responsavel=evento.responsavel,
        criado_em=evento.data_criacao,
        id_criador=evento.id_criador,
    )


def _can_edit_event(evento: EventoModel, current_user: UsuarioModel) -> bool:
    if current_user.nivel_acesso.nome_perfil == "adm":
        return True

    if evento.modo_edicao == "publica":
        return current_user.nivel_acesso.nome_perfil == "colaborador"

    if evento.id_criador == current_user.id_usuario:
        return True

    return any(user.id_usuario == current_user.id_usuario for user in evento.colaboradores)


def _validate_colaboradores_ids(colaboradores_ids: list[str], db: Session) -> list[str]:
    if not colaboradores_ids:
        return []

    unique_ids = list(dict.fromkeys(colaboradores_ids))
    users = db.query(UsuarioModel).filter(UsuarioModel.id_usuario.in_(unique_ids)).all()
    valid_ids = {
        user.id_usuario
        for user in users
        if user.ativo
        and user.deleted_at is None
        and user.nivel_acesso.nome_perfil == "colaborador"
    }
    invalid_ids = [user_id for user_id in unique_ids if user_id not in valid_ids]
    if invalid_ids:
        raise HTTPException(status_code=400, detail="Um ou mais colaboradores informados sao invalidos.")
    return unique_ids


def list_events(db: Session) -> list[EventoResponse]:
    repo = EventoRepository(db)
    eventos = repo.list_all()
    result = []
    for evento in eventos:
        count = repo.count_inscricoes(evento.id_evento)
        result.append(_serialize_evento(evento, count))
    return result


def list_events_scroll(
    skip: int,
    limit: int,
    search: str | None,
    area: str | None,
    turno: str | None,
    data_filtro: date | None,
    sort: str,
    role: str,
    db: Session,
    include_past: bool = False,
) -> ScrollEventoResponse:
    repo = EventoRepository(db)
    items, total = repo.list_scroll(
        skip=skip,
        limit=limit,
        search=search or None,
        area=area or None,
        turno=turno or None,
        data_filtro=data_filtro,
        sort=sort,
        role=role,
        include_past=include_past and role == "adm",
    )
    serialized = [_serialize_evento(e, repo.count_inscricoes(e.id_evento)) for e in items]
    return ScrollEventoResponse(
        items=serialized,
        total=total,
        tem_mais=(skip + len(items)) < total,
    )


def list_events_by_creator_or_colaborador(user_id: str, db: Session) -> list[EventoResponse]:
    repo = EventoRepository(db)
    eventos = repo.list_by_creator_or_colaborador(user_id)
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
    colaboradores_ids = _validate_colaboradores_ids(data.colaboradores_ids, db)

    evento = EventoModel(
        nome=data.nome,
        area=data.area,
        descricao=data.descricao,
        descricao_breve=data.descricao_breve,
        banner_url=extract_file_path(data.banner_url),
        data=data.data,
        horario=data.horario,
        turno=data.turno,
        local=data.local,
        vagas=data.vagas,
        data_limite_inscricao=data.data_limite_inscricao,
        tipo_inscricao=data.tipo_inscricao,
        url_externa=data.url_externa,
        visibilidade=data.visibilidade,
        modo_edicao=data.modo_edicao,
        responsavel=data.responsavel,
        id_criador=criador_id,
    )

    evento = repo.create(evento)

    if data.anexos:
        repo.set_anexos(evento.id_evento, _normalize_anexos(data.anexos))

    if data.cursos_ids:
        repo.set_cursos(evento.id_evento, data.cursos_ids)
    if data.palestrantes_ids:
        repo.set_palestrantes(evento.id_evento, data.palestrantes_ids)
    if colaboradores_ids:
        repo.set_colaboradores(evento.id_evento, colaboradores_ids)

    db.commit()

    evento = repo.get_by_id(evento.id_evento)
    return _serialize_evento(evento, 0)


def update_event(evento_id: str, data: EventoUpdate, current_user: UsuarioModel, db: Session) -> EventoResponse:
    repo = EventoRepository(db)
    evento = repo.get_by_id(evento_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")
    if not _can_edit_event(evento, current_user):
        raise HTTPException(status_code=403, detail="Sem permissao para editar este evento.")

    update_data = data.model_dump(exclude_unset=True)
    if "banner_url" in update_data:
        update_data["banner_url"] = extract_file_path(update_data["banner_url"])

    anexos = update_data.pop("anexos", None)
    cursos_ids = update_data.pop("cursos_ids", None)
    palestrantes_ids = update_data.pop("palestrantes_ids", None)
    colaboradores_ids = update_data.pop("colaboradores_ids", None)

    for field, value in update_data.items():
        setattr(evento, field, value)

    if cursos_ids is not None:
        repo.set_cursos(evento.id_evento, cursos_ids)
    if palestrantes_ids is not None:
        repo.set_palestrantes(evento.id_evento, palestrantes_ids)
    if colaboradores_ids is not None:
        repo.set_colaboradores(
            evento.id_evento,
            _validate_colaboradores_ids(colaboradores_ids, db),
        )
    if anexos is not None:
        repo.set_anexos(evento.id_evento, _normalize_anexos(anexos))

    repo.update(evento)

    evento = repo.get_by_id(evento_id)
    count = repo.count_inscricoes(evento_id)
    return _serialize_evento(evento, count)


def cancel_event(evento_id: str, db: Session) -> EventoCancelResponse:
    repo = EventoRepository(db)
    evento = repo.get_by_id(evento_id, include_cancelled=True)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")

    if evento.cancelado:
        raise HTTPException(
            status_code=409,
            detail="Evento ja esta cancelado.",
        )

    inscricoes_ativas = repo.list_event_enrollments(evento_id)
    for inscricao in inscricoes_ativas:
        db.add(
            EventoCancelamentoAvisoModel(
                id_usuario=inscricao.id_usuario,
                id_evento=evento_id,
                evento_nome=evento.nome,
                evento_data=evento.data,
                tipo="cancelamento",
            )
        )

    inscricoes_canceladas = repo.clear_event_enrollments(evento_id)
    evento.cancelado = True
    repo.update(evento)

    return EventoCancelResponse(
        sucesso=True,
        mensagem="Evento cancelado com sucesso.",
        evento_id=evento_id,
        inscricoes_canceladas=inscricoes_canceladas,
    )


def admin_remove_enrollment(evento_id: str, aluno_id: str, current_user: UsuarioModel, db: Session) -> None:
    repo = EventoRepository(db)
    evento = repo.get_by_id(evento_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")

    role = current_user.nivel_acesso.nome_perfil
    if role != "adm":
        is_colaborador_responsavel = any(
            u.id_usuario == current_user.id_usuario for u in evento.colaboradores
        )
        if not is_colaborador_responsavel:
            raise HTTPException(
                status_code=403,
                detail="Sem permissao para remover inscritos deste evento.",
            )

    from app.repositories.inscricao_repository import InscricaoRepository
    insc_repo = InscricaoRepository(db)
    inscricao = insc_repo.get_by_user_and_event(aluno_id, evento_id)
    if not inscricao:
        raise HTTPException(status_code=404, detail="Inscricao nao encontrada.")

    if inscricao.presenca is not None:
        raise HTTPException(
            status_code=409,
            detail="Nao e possivel remover uma inscricao com presenca confirmada.",
        )

    db.add(
        EventoCancelamentoAvisoModel(
            id_usuario=aluno_id,
            id_evento=evento_id,
            evento_nome=evento.nome,
            evento_data=evento.data,
            tipo="desincricao",
        )
    )

    insc_repo.delete(inscricao)


def admin_remove_all_enrollments(evento_id: str, current_user: UsuarioModel, db: Session) -> int:
    repo = EventoRepository(db)
    evento = repo.get_by_id(evento_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento nao encontrado.")

    role = current_user.nivel_acesso.nome_perfil
    if role != "adm":
        is_colaborador_responsavel = any(
            u.id_usuario == current_user.id_usuario for u in evento.colaboradores
        )
        if not is_colaborador_responsavel:
            raise HTTPException(
                status_code=403,
                detail="Sem permissao para remover inscritos deste evento.",
            )

    inscricoes_ativas = repo.list_event_enrollments(evento_id)
    # Apenas inscricoes sem presenca confirmada podem ser removidas
    inscricoes_para_remover = [i for i in inscricoes_ativas if i.presenca is None]

    if not inscricoes_para_remover:
        return 0

    for inscricao in inscricoes_para_remover:
        db.add(
            EventoCancelamentoAvisoModel(
                id_usuario=inscricao.id_usuario,
                id_evento=evento_id,
                evento_nome=evento.nome,
                evento_data=evento.data,
                tipo="desincricao",
            )
        )

    # Remover as inscricoes que nao tem presenca
    count = 0
    for inscricao in inscricoes_para_remover:
        # Nota: clear_event_enrollments deletaria todas, inclusive com presenca.
        # Aqui fazemos um a um para garantir que apenas as sem presenca sejam removidas.
        # E tambem para lidar com a limpeza de presenca se necessário (embora aqui tenhamos filtrado).
        
        # Como o clear_event_enrollments do repo lida com a deleção de presenças, 
        # mas queremos filtrar, vamos usar uma abordagem similar.
        from app.models.presenca import PresencaModel
        self_db = db
        self_db.query(PresencaModel).filter(
            PresencaModel.id_inscricao == inscricao.id_inscricao
        ).delete(synchronize_session=False)
        inscricao.qr_code_usuario = None
        self_db.flush()
        self_db.delete(inscricao)
        count += 1
    
    db.commit()
    return count
