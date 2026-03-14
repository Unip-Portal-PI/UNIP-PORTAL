from sqlalchemy.orm import Session, joinedload
from persistence.models.enrollment_model import EnrollmentModel
from persistence.models.event_model import EventModel
from datetime import datetime, timezone

# ==============================================================================
# REPOSITÓRIO DE INSCRIÇÕES E PRESENÇA (LOGISTICS LAYER)
# ==============================================================================
class EnrollmentRepository:
    """
    Gerencia o ciclo de vida das inscrições e o fluxo de check-in.
    Implementa a inteligência de validação de QR Code e gestão de presença.
    """
    
    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # GESTÃO DE INSCRIÇÕES 
    # ==========================================================================
    def create(self, user_id: int, event_id: int):
        """
        Registra a participação de um aluno em um evento.
        Contém trava de segurança contra inscrições duplicadas.
        """
        existing = self.db.query(EnrollmentModel).filter(
            EnrollmentModel.user_id == user_id,
            EnrollmentModel.event_id == event_id
        ).first()
        
        if existing:
            return "already_enrolled"

        new_enrollment = EnrollmentModel(user_id=user_id, event_id=event_id)
        self.db.add(new_enrollment)
        self.db.commit()
        self.db.refresh(new_enrollment)
        return new_enrollment

    # ==========================================================================
    # CONSULTAS DE ALUNO (EAGER LOADING)
    # ==========================================================================
    def list_by_user(self, user_id: int):
        """ 
        Lista o histórico de inscrições do aluno.
        Otimizado com joinedload para carregar os detalhes do evento em um único SQL.
        """
        return self.db.query(EnrollmentModel)\
            .options(joinedload(EnrollmentModel.event))\
            .filter(EnrollmentModel.user_id == user_id)\
            .all()

    # ==========================================================================
    # VALIDAÇÃO DE ACESSO (QR CODE ENGINE)
    # ==========================================================================
    def get_by_token(self, token: str):
        """ 
        Localiza uma inscrição pelo token único do QR Code.
        Carrega o perfil do aluno e os dados do evento para conferência no check-in.
        """
        return self.db.query(EnrollmentModel)\
            .options(
                joinedload(EnrollmentModel.event), 
                joinedload(EnrollmentModel.user)
            )\
            .filter(EnrollmentModel.qr_code_token == token).first()

    # ==========================================================================
    # CONTROLE DE PRESENÇA 
    # ==========================================================================
    def confirm_attendance(self, enrollment_id: int):
        """ 
        Efetiva o check-in do aluno no evento.
        Retorna o registro atualizado ou sinaliza se a presença já havia sido marcada.
        """
        enrollment = self.db.query(EnrollmentModel).filter(
            EnrollmentModel.id == enrollment_id
        ).first()

        if enrollment:
            if enrollment.is_present:
                return "already_confirmed"
            
            # Timestamp gerado no momento exato do "Bip" do QR Code
            enrollment.is_present = True
            enrollment.present_at = datetime.now(timezone.utc)
            
            self.db.commit()
            self.db.refresh(enrollment)
            return enrollment
        
        return None