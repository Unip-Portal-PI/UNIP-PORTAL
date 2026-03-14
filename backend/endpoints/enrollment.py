from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from persistence.database import get_db
from business.services.enrollment_service import EnrollmentService
from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.repositories.event_repository import EventRepository
from schemas.enrollment_schema import EnrollmentResponse
from core.security import RoleChecker, oauth2_scheme, settings
from jose import jwt, JWTError

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR E ACESSO (LOGISTICS ROUTER)
# ==============================================================================
router = APIRouter()

# Dependências de Acesso: Estudantes se inscrevem, Staff valida
require_student = RoleChecker(["Aluno", "Administrador"])
require_staff = RoleChecker(["Administrador", "Colaborador"])

def get_current_user_id(token: str) -> str:
    """Extrai o identificador único (sub) do JWT de forma segura."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Identificação de usuário ausente no token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

# ==============================================================================
# OPERAÇÕES DO ALUNO (STUDENT ACTIONS)
# ==============================================================================
@router.post(
    "/subscribe/{event_id}", 
    response_model=EnrollmentResponse, 
    dependencies=[Depends(require_student)],
    summary="Realiza inscrição em um evento",
    tags=["Inscrições"]
)
def subscribe_to_event(event_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """
    Inscreve o aluno logado em um evento.
    Valida existência do evento e impede inscrições duplicadas.
    """
    user_id = get_current_user_id(token)
    
    # Orquestração manual das dependências para o serviço
    service = EnrollmentService(
        EnrollmentRepository(db), 
        AuditRepository(db), 
        EventRepository(db)
    )
    
    result = service.enroll_user(int(user_id), event_id)
    
    if result == "event_not_found":
        raise HTTPException(status_code=404, detail="O evento solicitado não existe.")
    if result == "already_enrolled":
        raise HTTPException(status_code=400, detail="Você já possui uma inscrição ativa para este evento.")
    
    return result

@router.get(
    "/my-subscriptions", 
    response_model=List[EnrollmentResponse], 
    dependencies=[Depends(require_student)],
    summary="Lista inscrições do aluno logado",
    tags=["Inscrições"]
)
def list_my_subscriptions(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """Retorna o histórico de eventos e status de presença do aluno autenticado."""
    user_id = get_current_user_id(token)
    service = EnrollmentService(EnrollmentRepository(db), AuditRepository(db), EventRepository(db))
    return service.get_my_enrollments(int(user_id))

# ==============================================================================
# OPERAÇÕES DE STAFF (VALIDAÇÃO DE PRESENÇA)
# ==============================================================================
@router.post(
    "/validate/{qr_token}", 
    dependencies=[Depends(require_staff)],
    summary="Valida presença via QR Code",
    tags=["Controle de Acesso"]
)
def validate_attendance(qr_token: str, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """
    Endpoint utilizado pelo Staff para bipar o QR Code do aluno.
    Registra quem validou (staff_id) e impede dupla validação.
    """
    staff_id = get_current_user_id(token)
    service = EnrollmentService(EnrollmentRepository(db), AuditRepository(db), EventRepository(db))
    
    result = service.validate_attendance(qr_token, staff_id)
    
    if result == "invalid_token":
        raise HTTPException(status_code=404, detail="QR Code inválido. Inscrição não localizada.")
    if result == "already_validated":
        raise HTTPException(status_code=400, detail="Esta presença já foi confirmada anteriormente.")
    
    return {
        "status": "success",
        "message": "Presença confirmada! O certificado já está disponível para o aluno.", 
        "user_id": result.user_id
    }