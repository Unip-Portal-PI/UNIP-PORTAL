import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleChecker, get_current_user
from app.schemas.usuario import (
    MensagemResponse,
    UsuarioAdminCreateRequest,
    UsuarioAdminResponse,
    UsuarioAdminUpdateRequest,
    UsuarioPerfilResponse,
    UsuarioUpdateMeRequest,
    UsuarioUpdatePasswordRequest,
    UsuarioUpdatePhotoRequest,
)
from app.services import usuario_service

router = APIRouter(prefix="/users", tags=["Usuarios"])
logger = logging.getLogger("app.usuarios")

allow_adm = RoleChecker(["adm"])


@router.get("/me", response_model=UsuarioPerfilResponse)
def get_me(current_user=Depends(get_current_user)):
    return usuario_service.get_me(current_user)


@router.put("/me", response_model=UsuarioPerfilResponse)
def update_me(
    data: UsuarioUpdateMeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        result = usuario_service.update_me(data, current_user, db)
        logger.info("update_me_success user_id=%s", current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("update_me_failure user_id=%s status=%s detail=%s", current_user.id_usuario, exc.status_code, exc.detail)
        raise


@router.put("/me/password", response_model=MensagemResponse)
def update_my_password(
    data: UsuarioUpdatePasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        result = usuario_service.update_my_password(
            senha_atual=data.senha_atual,
            nova_senha=data.nova_senha,
            current_user=current_user,
            db=db,
        )
        logger.info("update_password_success user_id=%s", current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("update_password_failure user_id=%s status=%s detail=%s", current_user.id_usuario, exc.status_code, exc.detail)
        raise


@router.put("/me/photo", response_model=UsuarioPerfilResponse)
def update_my_photo(
    data: UsuarioUpdatePhotoRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = usuario_service.update_my_photo(data.foto_url, current_user, db)
    logger.info("update_photo_success user_id=%s", current_user.id_usuario)
    return result


@router.get("/", response_model=list[UsuarioAdminResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    return usuario_service.list_users(db)


@router.get("/{user_id}", response_model=UsuarioAdminResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    try:
        return usuario_service.get_user(user_id, db)
    except HTTPException as exc:
        logger.warning("get_user_failure user_id=%s status=%s detail=%s", user_id, exc.status_code, exc.detail)
        raise


@router.post("/", response_model=UsuarioAdminResponse, status_code=201)
def create_user(
    data: UsuarioAdminCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    try:
        result = usuario_service.create_user(data, current_user.id_usuario, db)
        logger.info("create_user_success matricula=%s created_by=%s", data.matricula, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("create_user_failure matricula=%s status=%s detail=%s", data.matricula, exc.status_code, exc.detail)
        raise


@router.put("/{user_id}", response_model=UsuarioAdminResponse)
def update_user(
    user_id: str,
    data: UsuarioAdminUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    try:
        result = usuario_service.update_user(user_id, data, db)
        logger.info("update_user_success user_id=%s updated_by=%s", user_id, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("update_user_failure user_id=%s status=%s detail=%s", user_id, exc.status_code, exc.detail)
        raise


@router.delete("/{user_id}", response_model=MensagemResponse)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    try:
        result = usuario_service.delete_user(user_id, current_user, db)
        logger.info("delete_user_success user_id=%s deleted_by=%s", user_id, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("delete_user_failure user_id=%s status=%s detail=%s", user_id, exc.status_code, exc.detail)
        raise


@router.post("/{user_id}/restore", response_model=MensagemResponse)
def restore_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    try:
        result = usuario_service.restore_user(user_id, db)
        logger.info("restore_user_success user_id=%s restored_by=%s", user_id, current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("restore_user_failure user_id=%s status=%s detail=%s", user_id, exc.status_code, exc.detail)
        raise
