from fastapi import APIRouter, Depends
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
    return comunicado_service.get_announcement(comunicado_id, current_user, db)


@router.post("/", response_model=ComunicadoResponse, status_code=201)
def create_announcement(
    data: ComunicadoCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return comunicado_service.create_announcement(data, current_user, db)


@router.put("/{comunicado_id}", response_model=ComunicadoResponse)
def update_announcement(
    comunicado_id: str,
    data: ComunicadoUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return comunicado_service.update_announcement(comunicado_id, data, current_user, db)


@router.delete("/{comunicado_id}", status_code=204)
def delete_announcement(
    comunicado_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    comunicado_service.delete_announcement(comunicado_id, current_user, db)
