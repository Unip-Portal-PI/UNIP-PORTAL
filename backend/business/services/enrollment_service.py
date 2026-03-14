from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.repositories.event_repository import EventRepository
from typing import Union, List

# ==============================================================================
# SERVIÇO DE LOGÍSTICA DE EVENTOS (EVENT LOGISTICS & ATTENDANCE)
# ==============================================================================
class EnrollmentService:
    """
    Serviço de Gestão de Inscrições e Presença.
    Controla o fluxo de entrada em eventos, desde a reserva da vaga até a 
    validação física via QR Code e registro de auditoria.
    """

    def __init__(self, 
                 enrollment_repo: EnrollmentRepository, 
                 audit_repo: AuditRepository,
                 event_repo: EventRepository):
        """
        Injeção de dependência dos repositórios de Inscrição, Auditoria e Eventos.
        """
        self.repo = enrollment_repo
        self.audit_repo = audit_repo
        self.event_repo = event_repo

    # ==========================================================================
    # FLUXO DE INSCRIÇÃO (BOOKING ENGINE)
    # ==========================================================================
    def enroll_user(self, user_id: int, event_id: int) -> Union[str, object]:
        """
        Realiza a inscrição de um aluno em um evento acadêmico.
        
        Regras de Integridade:
            1. O evento deve existir na base de dados.
            2. O sistema impede duplicidade (Unique Constraint gerida pelo Repo).
        """
        
        # 1. Validação de existência do evento alvo
        event = self.event_repo.get_by_id(event_id)
        if not event:
            return "event_not_found"

        # 2. Persistência da inscrição
        result = self.repo.create(user_id, event_id)
        
        if result == "already_enrolled":
            return "already_enrolled"

        # 3. Registro de Auditoria (Rastreabilidade da Inscrição)
        if result:
            self.audit_repo.log_action(
                user_id=str(user_id),
                action="EVENT_ENROLL",
                table_name="enrollments",
                description=f"Inscrição realizada no evento ID: {event_id} ({event.name})"
            )
        
        return result

    # ==========================================================================
    # VALIDAÇÃO DE PRESENÇA (CHECK-IN SYSTEM)
    # ==========================================================================
    def validate_attendance(self, qr_token: str, staff_id: str) -> Union[str, object]:
        """
        Valida a presença do aluno no local do evento via token de QR Code.
        
        Args:
            qr_token: Token UUID único gerado no momento da inscrição.
            staff_id: ID do administrador/colaborador (Staff) que realiza a leitura.
        """
        
        # 1. Localização da inscrição pelo Token do QR Code
        enrollment = self.repo.get_by_token(qr_token)
        
        if not enrollment:
            return "invalid_token"
        
        # 2. Proteção contra dupla validação (Prevenção de fraude ou erro de leitura)
        if enrollment.is_present:
            return "already_validated"

        # 3. Atualização de status (Check-in)
        updated = self.repo.confirm_attendance(enrollment.id)
        
        if updated:
            # Auditoria: Registra quem validou a presença para controle administrativo
            self.audit_repo.log_action(
                user_id=str(staff_id),
                action="VALIDATE_PRESENCE",
                table_name="enrollments",
                description=(f"Staff {staff_id} validou presença do usuário {updated.user_id} "
                             f"no evento {updated.event_id}")
            )
            
        return updated

    # ==========================================================================
    # CONSULTAS E RELATÓRIOS DE ACESSO
    # ==========================================================================
    def get_my_enrollments(self, user_id: int) -> List:
        """ 
        Recupera o histórico de inscrições do aluno para exibição no Dashboard.
        """
        return self.repo.list_by_user(user_id)

    def get_enrollment_details(self, qr_token: str):
        """
        Busca metadados detalhados de uma inscrição específica.
        Utilizado no modal de confirmação do App do Staff ao bipar o QR Code.
        """
        enrollment = self.repo.get_by_token(qr_token)
        if not enrollment:
            return None
        return enrollment