from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.schemas.evento import EventoResponse, EventoCreate, EventoUpdate
from app.schemas.inscricao import InscricaoResponse
from app.services import evento_service, inscricao_service

router = APIRouter(prefix="/events", tags=["Eventos"])

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])
allow_adm = RoleChecker(["adm"])
allow_aluno = RoleChecker(["aluno"])


@router.get("/", response_model=list[EventoResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return evento_service.list_events(db)


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
    return evento_service.update_event(evento_id, data, db)


@router.delete("/{evento_id}", status_code=204)
def delete_event(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_adm),
):
    evento_service.delete_event(evento_id, db)


@router.post("/{evento_id}/enroll", response_model=InscricaoResponse, status_code=201)
def enroll(
    evento_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(allow_aluno),
):
    return inscricao_service.enroll(evento_id, current_user.id_usuario, db)


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
