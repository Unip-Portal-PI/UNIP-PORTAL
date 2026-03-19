from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from persistence.database import Base
from datetime import datetime, timezone
import uuid

# ==============================================================================
# DEFINIÇÃO DA TABELA DE INSCRIÇÕES (NÚCLEO LOGÍSTICO)
# ==============================================================================
class EnrollmentModel(Base):
    """
    Entidade que mapeia a participação de um usuário em um evento.
    Responsável por gerenciar tokens de acesso (QR Code) e controle de presença.
    """
    
    # Nome físico da tabela: Armazena o histórico de inscrições
    __tablename__ = "enrollments"

    # ==========================================================================
    # CHAVES E RELACIONAMENTOS (INTEGRIDADE RELACIONAL)
    # ==========================================================================
    # Identificador único da inscrição
    id = Column(Integer, primary_key=True, index=True)
    
    # Vínculo com a tabela de Usuários (Users)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Vínculo com a tabela de Eventos (Events)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    
    # ==========================================================================
    # INTELIGÊNCIA DE ACESSO (MOTOR DE QR CODE)
    # ==========================================================================
    # Token UUID único para validação segura via QR Code
    qr_code_token = Column(String(255), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Data/Hora da inscrição (Usando UTC para consistência)
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ==========================================================================
    # STATUS E RASTREABILIDADE DE PRESENÇA
    # ==========================================================================
    # Flag de confirmação de presença (Check-in)
    is_present = Column(Boolean, default=False)
    
    # Registra o momento exato da validação física no evento
    present_at = Column(DateTime, nullable=True)

    # ==========================================================================
    # MAPEAMENTO DE RELACIONAMENTOS ORM
    # ==========================================================================
    # Estes relacionamentos permitem que o SQLAlchemy busque o objeto completo
    
    user = relationship("UserModel", backref="user_enrollments")
    event = relationship("EventModel", backref="event_enrollments")

    # ==========================================================================
    # PROPRIEDADES LÓGICAS DINÂMICAS (AUXILIARES DE "FLATTENING")
    # ==========================================================================
    # Estas propriedades ajudam o Schema a acessar dados do Evento de forma simples
    
    @property
    def event_name(self):
        """Retorna o título do evento vinculado (de EventModel.title)."""
        return self.event.title if self.event else None

    @property
    def event_scheduled_date(self):
        """Retorna a data real do evento (de EventModel.event_date)."""
        return self.event.event_date if self.event else None

    @property
    def event_start_time_val(self):
        """Retorna o horário de início do evento (de EventModel.start_time)."""
        return self.event.start_time if self.event else None