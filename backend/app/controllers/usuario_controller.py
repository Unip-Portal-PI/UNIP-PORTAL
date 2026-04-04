from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleChecker, get_current_user
from app.schemas.usuario import (
    MensagemResponse,
    UsuarioAdminCreateRequest,
    UsuarioAdminResponse,
    UsuarioAdminUpdateRequest,
    UsuarioPerfilResponse,
    UsuarioResumoResponse,
    UsuarioUpdateMeRequest,
    UsuarioUpdatePasswordRequest,
    UsuarioUpdatePhotoRequest,
)
from app.services import usuario_service

router = APIRouter(prefix="/users", tags=["Usuarios"])

allow_adm = RoleChecker(["adm"])


@router.get("/me", response_model=UsuarioPerfilResponse)
def get_me(current_user=Depends(get_current_user)):
    return usuario_service.get_me(current_user)


@router.get("/collaborators", response_model=list[UsuarioResumoResponse])
def list_active_collaborators(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return usuario_service.list_active_collaborators(db)


@router.put("/me", response_model=UsuarioPerfilResponse)
def update_me(
    data: UsuarioUpdateMeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return usuario_service.update_me(data, current_user, db)


@router.put("/me/password", response_model=MensagemResponse)
def update_my_password(
    data: UsuarioUpdatePasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return usuario_service.update_my_password(
        senha_atual=data.senha_atual,
        nova_senha=data.nova_senha,
        current_user=current_user,
        db=db,
    )


@router.put("/me/photo", response_model=UsuarioPerfilResponse)
def update_my_photo(
    data: UsuarioUpdatePhotoRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return usuario_service.update_my_photo(data.foto_url, current_user, db)


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
    return usuario_service.get_user(user_id, db)


@router.post("/", response_model=UsuarioAdminResponse, status_code=201)
def create_user(
    data: UsuarioAdminCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    return usuario_service.create_user(data, current_user.id_usuario, db)


@router.put("/{user_id}", response_model=UsuarioAdminResponse)
def update_user(
    user_id: str,
    data: UsuarioAdminUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    return usuario_service.update_user(user_id, data, db)


@router.delete("/{user_id}", response_model=MensagemResponse)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    return usuario_service.delete_user(user_id, current_user, db)


@router.post("/{user_id}/restore", response_model=MensagemResponse)
def restore_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    return usuario_service.restore_user(user_id, db)
