import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.schemas.evento import (
    EventoCancelResponse,
    EventoCreate,
    EventoResponse,
    EventoUpdate,
    ScrollEventoResponse,
)
from app.schemas.inscricao import (
    InscricaoResponse,
    PresencaConfirmRequest,
    PresencaConfirmResponse,
)
from app.services import evento_service, inscricao_service, presenca_service

router = APIRouter(prefix="/events", tags=["Eventos"])
logger = logging.getLogger("app.qr")

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])
allow_adm = RoleChecker(["adm"])
allow_aluno = RoleChecker(["aluno"])


@router.get("/", response_model=ScrollEventoResponse)
def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=10000),
    search: str | None = Query(None),
    area: str | None = Query(None),
    turno: str | None = Query(None),
    data: date | None = Query(None),
    sort: str = Query("proximos"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role = current_user.nivel_acesso.nome_perfil
    return evento_service.list_events_scroll(
        skip=skip,
        limit=limit,
        search=search,
        area=area,
        turno=turno,
        data_filtro=data,
        sort=sort,
        role=role,
        db=db,
    )


@router.get("/mine/created", response_model=list[EventoResponse])
def list_my_created_events(
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return evento_service.list_events_by_creator_or_colaborador(current_user.id_usuario, db)

@router.get("/mine/enrollments", response_model=list[InscricaoResponse])
def list_my_enrollments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return inscricao_service.list_my_enrollments(current_user.id_usuario, db)


@router.get("/{evento_id}", response_model=EventoResponse)
def get_event(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return evento_service.get_event(evento_id, db)


@router.post("/", response_model=EventoResponse, status_code=201)
def create_event(
    data: EventoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return evento_service.create_event(data, current_user.id_usuario, db)


@router.put("/{evento_id}", response_model=EventoResponse)
def update_event(
    evento_id: str,
    data: EventoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return evento_service.update_event(evento_id, data, current_user, db)


@router.delete("/{evento_id}", response_model=EventoCancelResponse)
def cancel_event(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    return evento_service.cancel_event(evento_id, db)


@router.post("/{evento_id}/enroll", response_model=InscricaoResponse, status_code=201)
def enroll(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_aluno),
):
    return inscricao_service.enroll(evento_id, current_user.id_usuario, db)


@router.delete("/{evento_id}/enroll", status_code=204)
def cancel_enrollment(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_aluno),
):
    inscricao_service.cancel_enrollment(evento_id, current_user.id_usuario, db)


@router.get("/{evento_id}/enrollments", response_model=list[InscricaoResponse])
def list_enrollments(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return inscricao_service.list_enrollments(evento_id, db)


@router.delete("/{evento_id}/enrollments/{aluno_id}", status_code=204)
def admin_remove_enrollment(
    evento_id: str,
    aluno_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    evento_service.admin_remove_enrollment(evento_id, aluno_id, current_user, db)


@router.delete("/{evento_id}/enrollments", status_code=200)
def admin_remove_all_enrollments(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    count = evento_service.admin_remove_all_enrollments(evento_id, current_user, db)
    return {"sucesso": True, "mensagem": f"{count} inscricoes removidas com sucesso."}


@router.get("/{evento_id}/my-enrollment", response_model=InscricaoResponse | None)
def my_enrollment(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return inscricao_service.get_my_enrollment(evento_id, current_user.id_usuario, db)


@router.post("/{evento_id}/check-in", response_model=PresencaConfirmResponse)
def confirm_presence_by_event(
    evento_id: str,
    data: PresencaConfirmRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    client_ip = request.client.host if request.client else "unknown"
    qr_preview = (data.qr_code or "")[:24]
    logger.info(
        "qr_checkin_request ip=%s evento_id=%s user_id=%s qr_prefix=%s",
        client_ip,
        evento_id,
        current_user.id_usuario,
        qr_preview,
    )
    try:
        result = presenca_service.confirm_presence(
            qr_code=data.qr_code,
            confirmado_por=current_user.id_usuario,
            db=db,
            evento_id=evento_id,
        )
        logger.info(
            "qr_checkin_response ip=%s evento_id=%s success=%s message=%s",
            client_ip,
            evento_id,
            result.sucesso,
            result.mensagem,
        )
        return result
    except HTTPException as exc:
        logger.warning(
            "qr_checkin_failure ip=%s evento_id=%s status=%s detail=%s qr_prefix=%s",
            client_ip,
            evento_id,
            exc.status_code,
            exc.detail,
            qr_preview,
        )
        raise
