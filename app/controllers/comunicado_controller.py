import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleChecker, get_current_user
from app.schemas.comunicado import (
    ComunicadoCreateRequest,
    ComunicadoResponse,
    ComunicadoUpdateRequest,
)
from app.services import comunicado_service

router = APIRouter(prefix="/announcements", tags=["Comunicados"])
logger = logging.getLogger("app.comunicados")

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])


@router.get("/", response_model=list[ComunicadoResponse])
def list_announcements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return comunicado_service.list_announcements(current_user, db)


@router.get("/mine", response_model=list[ComunicadoResponse])
def list_my_announcements(
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return comunicado_service.list_my_announcements(current_user, db)


@router.get("/{comunicado_id}", response_model=ComunicadoResponse)
def get_announcement(
    comunicado_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return comunicado_service.get_announcement(comunicado_id, current_user, db)
    except HTTPException as exc:
        logger.warning("get_announcement_failure comunicado_id=%s status=%s detail=%s", comunicado_id, exc.status_code, exc.detail)
        raise


@router.post("/", response_model=ComunicadoResponse, status_code=201)
def create_announcement(
    data: ComunicadoCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    try:
        result = comunicado_service.create_announcement(data, current_user, db)
        logger.info("create_announcement_success comunicado_id=%s user_id=%s", result.id, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("create_announcement_failure user_id=%s status=%s detail=%s", current_user.id_usuario, exc.status_code, exc.detail)
        raise


@router.put("/{comunicado_id}", response_model=ComunicadoResponse)
def update_announcement(
    comunicado_id: str,
    data: ComunicadoUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    try:
        result = comunicado_service.update_announcement(comunicado_id, data, current_user, db)
        logger.info("update_announcement_success comunicado_id=%s user_id=%s", comunicado_id, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("update_announcement_failure comunicado_id=%s status=%s detail=%s", comunicado_id, exc.status_code, exc.detail)
        raise


@router.delete("/{comunicado_id}", status_code=204)
def delete_announcement(
    comunicado_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    try:
        comunicado_service.delete_announcement(comunicado_id, current_user, db)
        logger.info("delete_announcement_success comunicado_id=%s user_id=%s", comunicado_id, current_user.id_usuario)
    except HTTPException as exc:
        logger.warning("delete_announcement_failure comunicado_id=%s status=%s detail=%s", comunicado_id, exc.status_code, exc.detail)
        raise
