from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from persistence.models.enrollment_model import EnrollmentModel
from persistence.models.event_model import EventModel
from datetime import datetime, timezone, date
import uuid
from typing import Optional, List, Union

# ==============================================================================
# REPOSITÓRIO DE INSCRIÇÕES E PRESENÇA (CAMADA DE LOGÍSTICA)
# ==============================================================================
class EnrollmentRepository:
    """
    Gerencia o ciclo de vida das inscrições e o fluxo de check-in.
    Sincronizado com o EventModel (event_date, start_time, shift).
    """
    
    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # GESTÃO DE INSCRIÇÕES
    # ==========================================================================
    def create(self, user_id: int, event_id: int) -> Union[EnrollmentModel, str]:
        """
        Registra a participação de um aluno em um evento.
        Gera automaticamente um UUID para o QR Code.
        """
        # Verifica se o aluno já está inscrito neste evento específico
        existing = self.db.query(EnrollmentModel).filter(
            EnrollmentModel.user_id == user_id,
            EnrollmentModel.event_id == event_id
        ).first()
        
        if existing:
            return "already_enrolled"

        # Criação da inscrição com o token único obrigatório para o QR Code
        new_enrollment = EnrollmentModel(
            user_id=user_id, 
            event_id=event_id,
            qr_code_token=str(uuid.uuid4()), # Identificador Único do QR Code
            is_present=False,
            enrolled_at=datetime.now(timezone.utc)
        )
        
        try:
            self.db.add(new_enrollment)
            self.db.commit()
            self.db.refresh(new_enrollment)
            return new_enrollment
        except Exception:
            self.db.rollback()
            return "error"

    def check_time_conflict(self, user_id: int, event_date: date, start_time: str) -> bool:
        """
        Verifica se o aluno já está inscrito em outro evento 
        no MESMO DIA e MESMO HORÁRIO de início.
        """
        conflict_exists = self.db.query(EnrollmentModel)\
            .join(EventModel)\
            .filter(
                EnrollmentModel.user_id == user_id,
                EventModel.event_date == event_date, 
                EventModel.start_time == start_time, 
                EnrollmentModel.is_present == False  # Conflito apenas se ele ainda não fez check-in
            ).first()
        
        return conflict_exists is not None

    # ==========================================================================
    # CONSULTAS DO ALUNO (CARREGAMENTO ANTECIPADO / EAGER LOADING)
    # ==========================================================================
    def list_by_user(self, user_id: int) -> List[EnrollmentModel]:
        """ 
        Lista as inscrições do aluno carregando detalhes do evento (título, local, data).
        """
        return self.db.query(EnrollmentModel)\
            .options(joinedload(EnrollmentModel.event))\
            .filter(EnrollmentModel.user_id == user_id)\
            .order_by(EnrollmentModel.enrolled_at.desc())\
            .all()

    # ==========================================================================
    # CONSULTAS DE STAFF (RELATÓRIOS DE EVENTO)
    # ==========================================================================
    def list_by_event(self, event_id: int) -> List[EnrollmentModel]:
        """
        Lista os inscritos de um evento carregando dados do usuário (nome, matrícula).
        """
        return self.db.query(EnrollmentModel)\
            .options(joinedload(EnrollmentModel.user))\
            .filter(EnrollmentModel.event_id == event_id)\
            .order_by(EnrollmentModel.enrolled_at.asc())\
            .all()

    # ==========================================================================
    # VALIDAÇÃO DE ACESSO (MOTOR DE QR CODE)
    # ==========================================================================
    def get_by_token(self, token: str) -> Optional[EnrollmentModel]:
        """ 
        Localiza a inscrição via token do QR Code, incluindo Usuário e Evento para um "Retorno Rico".
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
    def confirm_attendance(self, enrollment_id: int) -> Union[EnrollmentModel, str, None]:
        """ 
        Efetiva o check-in do aluno no evento.
        Retorna o objeto completo para que o Service possa construir o JSON de resposta.
        """
        enrollment = self.db.query(EnrollmentModel).filter(
            EnrollmentModel.id == enrollment_id
        ).first()

        if not enrollment:
            return None

        # Evita duplicidade de check-in
        if enrollment.is_present:
            return "already_confirmed"
        
        enrollment.is_present = True
        enrollment.present_at = datetime.now(timezone.utc)
        
        self.db.commit()
        
        # Recarrega com joins para garantir que o Service tenha os nomes dos objetos relacionados
        return self.db.query(EnrollmentModel)\
            .options(joinedload(EnrollmentModel.user), joinedload(EnrollmentModel.event))\
            .filter(EnrollmentModel.id == enrollment_id).first()