from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from persistence.database import get_db
from business.services.enrollment_service import EnrollmentService
from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.repositories.event_repository import EventRepository
from schemas.enrollment_schema import EnrollmentResponse, EventAttendanceReport
from core.security import RoleChecker, oauth2_scheme, settings
from jose import jwt, JWTError

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR E ACESSO (LOGISTICS ROUTER)
# ==============================================================================
router = APIRouter()

# Roles sincronizadas com o padrão global (admin, staff, student)
require_student = RoleChecker(["student", "staff", "admin"]) 
require_staff = RoleChecker(["admin", "staff"])

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """Extrai o identificador único (sub) do JWT de forma segura."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Identificação ausente.")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

# ==============================================================================
# OPERAÇÕES DO ALUNO (STUDENT ACTIONS)
# ==============================================================================

@router.post(
    "/subscribe/{event_id}", 
    response_model=EnrollmentResponse, 
    dependencies=[Depends(require_student)],
    summary="Realiza inscrição em um evento",
    tags=["Logística - Inscrições"]
)
def subscribe_to_event(
    event_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Inscreve o aluno logado em um evento com validação de conflito de horário."""
    service = EnrollmentService(EnrollmentRepository(db), AuditRepository(db), EventRepository(db))
    result = service.enroll_user(current_user_id, event_id)
    
    # Validações de erro para evitar ResponseValidationError (500)
    if result == "event_not_found":
        raise HTTPException(status_code=404, detail="O evento solicitado não existe.")
    
    if result == "already_enrolled":
        raise HTTPException(status_code=400, detail="Você já possui uma inscrição ativa para este evento.")
    
    if result == "time_conflict":
        raise HTTPException(
            status_code=400, 
            detail="Conflito de horário! Você já tem outro evento agendado para este mesmo período."
        )
    
    return result

@router.get(
    "/my-subscriptions", 
    response_model=List[EnrollmentResponse], 
    dependencies=[Depends(require_student)],
    summary="Lista inscrições do aluno logado",
    tags=["Logística - Inscrições"]
)
def list_my_subscriptions(
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Retorna o histórico de eventos e status de presença do aluno autenticado."""
    service = EnrollmentService(EnrollmentRepository(db), AuditRepository(db), EventRepository(db))
    return service.get_my_enrollments(current_user_id)

# ==============================================================================
# OPERAÇÕES DE STAFF (CONTROLE E RELATÓRIOS)
# ==============================================================================

@router.post(
    "/validate/{qr_token}", 
    dependencies=[Depends(require_staff)],
    summary="Valida presença via QR Code",
    tags=["Logística - Controle de Acesso"]
)
def validate_attendance(
    qr_token: str, 
    db: Session = Depends(get_db), 
    staff_id: int = Depends(get_current_user_id)
):
    """Endpoint para Staff bipar o QR Code do aluno."""
    service = EnrollmentService(EnrollmentRepository(db), AuditRepository(db), EventRepository(db))
    result = service.validate_attendance(qr_token, str(staff_id))
    
    if result == "invalid_token":
        raise HTTPException(status_code=404, detail="QR Code inválido.")
    if result == "already_validated":
        raise HTTPException(status_code=400, detail="Presença já confirmada.")
    
    return {
        "status": "success",
        "message": "Presença confirmada!", 
        "user_id": result.user_id
    }

@router.post(
    "/manual-checkin/{enrollment_id}", 
    dependencies=[Depends(require_staff)],
    summary="Realiza check-in manual (Contingência)",
    tags=["Logística - Controle de Acesso"]
)
def manual_checkin(
    enrollment_id: int, 
    db: Session = Depends(get_db), 
    staff_id: int = Depends(get_current_user_id)
):
    """
    Confirma a presença manualmente via ID da inscrição (Plano B).
    """
    service = EnrollmentService(EnrollmentRepository(db), AuditRepository(db), EventRepository(db))
    result = service.manual_checkin(enrollment_id, str(staff_id))
    
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Inscrição não localizada.")
    if result == "already_validated":
        raise HTTPException(status_code=400, detail="Este aluno já consta como presente.")
    
    return {
        "status": "success",
        "message": f"Check-in manual realizado com sucesso para o inscrito {enrollment_id}!",
        "present_at": result.present_at
    }

@router.get(
    "/event/{event_id}/attendees", 
    response_model=EventAttendanceReport,
    dependencies=[Depends(require_staff)],
    summary="Relatório de presença do evento",
    tags=["Logística - Relatórios"]
)
def get_event_attendees(
    event_id: int, 
    db: Session = Depends(get_db)
):
    """
    Lista todos os alunos inscritos com estatísticas de presença.
    """
    service = EnrollmentService(EnrollmentRepository(db), AuditRepository(db), EventRepository(db))
    result = service.get_event_attendance_list(event_id)
    
    if result == "event_not_found":
        raise HTTPException(status_code=404, detail="Evento não localizado.")
        
    return result