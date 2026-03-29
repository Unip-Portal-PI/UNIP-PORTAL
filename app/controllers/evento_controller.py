import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.schemas.evento import EventoResponse, EventoCreate, EventoUpdate
from app.schemas.inscricao import (
    InscricaoResponse,
    PresencaConfirmRequest,
    PresencaConfirmResponse,
)
from app.services import evento_service, inscricao_service, presenca_service

router = APIRouter(prefix="/events", tags=["Eventos"])
logger = logging.getLogger("app.eventos")

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])
allow_adm = RoleChecker(["adm"])
allow_aluno = RoleChecker(["aluno"])


@router.get("/", response_model=list[EventoResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return evento_service.list_events(db)


@router.get("/mine/created", response_model=list[EventoResponse])
def list_my_created_events(
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return evento_service.list_events_by_creator(current_user.id_usuario, db)


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
    try:
        return evento_service.get_event(evento_id, db)
    except HTTPException as exc:
        logger.warning("get_event_failure evento_id=%s status=%s detail=%s", evento_id, exc.status_code, exc.detail)
        raise


@router.post("/", response_model=EventoResponse, status_code=201)
def create_event(
    data: EventoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    try:
        result = evento_service.create_event(data, current_user.id_usuario, db)
        logger.info("create_event_success evento_id=%s user_id=%s nome=%s", result.id, current_user.id_usuario, data.nome)
        return result
    except HTTPException as exc:
        logger.warning("create_event_failure user_id=%s status=%s detail=%s", current_user.id_usuario, exc.status_code, exc.detail)
        raise


@router.put("/{evento_id}", response_model=EventoResponse)
def update_event(
    evento_id: str,
    data: EventoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    try:
        result = evento_service.update_event(evento_id, data, db)
        logger.info("update_event_success evento_id=%s user_id=%s", evento_id, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("update_event_failure evento_id=%s status=%s detail=%s", evento_id, exc.status_code, exc.detail)
        raise


@router.delete("/{evento_id}", status_code=204)
def delete_event(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    try:
        evento_service.delete_event(evento_id, db)
        logger.info("delete_event_success evento_id=%s user_id=%s", evento_id, current_user.id_usuario)
    except HTTPException as exc:
        logger.warning("delete_event_failure evento_id=%s status=%s detail=%s", evento_id, exc.status_code, exc.detail)
        raise


@router.post("/{evento_id}/enroll", response_model=InscricaoResponse, status_code=201)
def enroll(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_aluno),
):
    try:
        result = inscricao_service.enroll(evento_id, current_user.id_usuario, db)
        logger.info("enroll_success evento_id=%s user_id=%s", evento_id, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("enroll_failure evento_id=%s user_id=%s status=%s detail=%s", evento_id, current_user.id_usuario, exc.status_code, exc.detail)
        raise


@router.delete("/{evento_id}/enroll", status_code=204)
def cancel_enrollment(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_aluno),
):
    try:
        inscricao_service.cancel_enrollment(evento_id, current_user.id_usuario, db)
        logger.info("cancel_enrollment_success evento_id=%s user_id=%s", evento_id, current_user.id_usuario)
    except HTTPException as exc:
        logger.warning("cancel_enrollment_failure evento_id=%s user_id=%s status=%s detail=%s", evento_id, current_user.id_usuario, exc.status_code, exc.detail)
        raise


@router.get("/{evento_id}/enrollments", response_model=list[InscricaoResponse])
def list_enrollments(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return inscricao_service.list_enrollments(evento_id, db)


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
