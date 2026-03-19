from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.repositories.event_repository import EventRepository
from typing import Union, List, Dict, Any
from datetime import date

# ==============================================================================
# SERVIÇO DE LOGÍSTICA DE EVENTOS (EVENT LOGISTICS & ATTENDANCE)
# ==============================================================================
class EnrollmentService:
    """
    Serviço de Gestão de Inscrições e Presença.
    Controla o fluxo de entrada em eventos, desde a reserva da vaga (validando 
    capacidade e prazos) até a validação física via QR Code com retorno de dados.
    """

    def __init__(self, 
                 enrollment_repo: EnrollmentRepository, 
                 audit_repo: AuditRepository,
                 event_repo: EventRepository):
        """
        Injeção de dependência dos repositórios necessários.
        """
        self.repo = enrollment_repo
        self.audit_repo = audit_repo
        self.event_repo = event_repo

    # ==========================================================================
    # FLUXO DE INSCRIÇÃO (BOOKING ENGINE)
    # ==========================================================================
    def enroll_user(self, user_id: int, event_id: int) -> Union[str, object]:
        """
        Realiza a inscrição de um aluno validando:
        1. Existência do evento.
        2. Prazo limite de inscrição (deadline_date).
        3. Disponibilidade de vagas (occupied_slots vs total_slots).
        4. Conflitos de horário e duplicidade.
        """
        # 1. Validação de existência do evento alvo
        event = self.event_repo.get_by_id(event_id)
        if not event:
            return "event_not_found"

        # 2. Validação de Prazo de Inscrição
        if event.deadline_date < date.today():
            return "deadline_exceeded"

        # 3. Validação de Capacidade (Vagas)
        if event.occupied_slots >= event.total_slots:
            return "no_slots_available"

        # 4. [PERFORMANCE] Validação de conflito de horário direto no Banco
        has_conflict = self.repo.check_time_conflict(
            user_id=user_id,
            event_date=event.event_date,
            start_time=event.start_time
        )
        
        if has_conflict:
            return "time_conflict"

        # 5. Persistência da inscrição (O repo já trata duplicidade interna)
        result = self.repo.create(user_id, event_id)
        
        if result == "already_enrolled":
            return "already_enrolled"

        # 6. Atualização do contador de vagas e Auditoria
        if result:
            # Incrementa as vagas ocupadas no modelo do evento
            self.event_repo.increment_occupancy(event_id)

            self.audit_repo.log_action(
                user_id=str(user_id),
                action="EVENT_ENROLL",
                table_name="enrollments",
                description=f"Inscrição realizada no evento: {event.title} (ID: {event_id})"
            )
        
        return result

    # ==========================================================================
    # VALIDAÇÃO DE PRESENÇA (CHECK-IN SYSTEM COM RETORNO RICO)
    # ==========================================================================
    def validate_attendance(self, qr_token: str, staff_id: str) -> Union[str, Dict[str, Any]]:
        """
        Valida a presença via QR Code e retorna o JSON RICO com dados do aluno.
        """
        # Busca inscrição pelo token incluindo os dados do usuário (Join)
        enrollment = self.repo.get_by_token(qr_token)
        
        if not enrollment:
            return "invalid_token"
        
        if enrollment.is_present:
            return "already_validated"

        # Confirma a presença no banco de dados
        updated = self.repo.confirm_attendance(enrollment.id)
        
        if updated:
            # Registro de auditoria do staff que validou
            self.audit_repo.log_action(
                user_id=str(staff_id),
                action="VALIDATE_PRESENCE",
                table_name="enrollments",
                description=f"Staff {staff_id} validou presença do aluno {updated.user.name}"
            )
            
            # Retorno formatado para visualização no App do Staff (JSON RICO)
            return {
                "status": "success",
                "message": "Presença confirmada!",
                "data": {
                    "user_id": updated.user_id,
                    "student_name": updated.user.name,
                    "student_registration": getattr(updated.user, 'registration_number', 'N/A'),
                    "nickname": getattr(updated.user, 'nickname', ''),
                    "area": getattr(updated.user, 'area', 'N/A'),
                    "event_name": updated.event.title,
                    "confirmed_at": updated.present_at.strftime("%H:%M:%S") if updated.present_at else None
                }
            }
            
        return "error_updating"

    def manual_checkin(self, enrollment_id: int, staff_id: str) -> Union[str, object]:
        """
        Realiza o check-in manual (Contingência caso o QR falhe).
        """
        updated = self.repo.confirm_attendance(enrollment_id)
        
        if updated == "already_confirmed":
            return "already_validated"
        
        if not updated:
            return "not_found"

        self.audit_repo.log_action(
            user_id=str(staff_id),
            action="MANUAL_CHECKIN",
            table_name="enrollments",
            description=f"Check-in MANUAL do inscrito ID: {enrollment_id} pelo Staff {staff_id}"
        )
            
        return updated

    # ==========================================================================
    # CONSULTAS E RELATÓRIOS
    # ==========================================================================
    def get_my_enrollments(self, user_id: int) -> List:
        """Lista as inscrições do próprio aluno logado."""
        return self.repo.list_by_user(user_id)

    def get_event_attendance_list(self, event_id: int) -> Union[str, Dict[str, Any]]:
        """
        Gera relatório consolidado de presença para a Administração.
        """
        event = self.event_repo.get_by_id(event_id)
        if not event:
            return "event_not_found"

        enrollments = self.repo.list_by_event(event_id)
        
        total = len(enrollments)
        present_count = sum(1 for e in enrollments if e.is_present)
        
        return {
            "event_title": event.title,
            "total_enrolled": total,
            "total_present": present_count,
            "attendees": [
                {
                    "name": e.user.name,
                    "registration": getattr(e.user, 'registration_number', 'N/A'),
                    "area": getattr(e.user, 'area', 'N/A'),
                    "is_present": e.is_present,
                    "confirmed_at": e.present_at
                } for e in enrollments
            ]
        }

    def get_enrollment_details(self, qr_token: str):
        """Retorna detalhes brutos da inscrição via token."""
        return self.repo.get_by_token(qr_token)