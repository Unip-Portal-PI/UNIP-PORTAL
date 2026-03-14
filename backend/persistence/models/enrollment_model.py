from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from persistence.database import Base
from datetime import datetime, timezone
import uuid

# ==============================================================================
# DEFINIÇÃO DA TABELA DE INSCRIÇÕES (LOGISTICS CORE)
# ==============================================================================
class EnrollmentModel(Base):
    """
    Entidade que mapeia a participação de um usuário em um evento.
    Responsável por gerenciar tokens de acesso (QR Code) e controle de presença.
    """
    
    # Nome físico da tabela: Armazena o histórico de inscrições
    __tablename__ = "enrollments"

    # ==========================================================================
    # CHAVES E VÍNCULOS (RELATIONAL INTEGRITY)
    # ==========================================================================
    # Identificador único da inscrição
    id = Column(Integer, primary_key=True, index=True)
    
    # Vínculo com a tabela de Usuários (Many-to-One)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Vínculo com a tabela de Eventos (Many-to-One)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    
    # ==========================================================================
    # INTELIGÊNCIA DE ACESSO (QR CODE ENGINE)
    # ==========================================================================
    # Token único UUID para validação segura via QR Code.
    qr_code_token = Column(String(255), unique=True, default=lambda: str(uuid.uuid4()))
    
    # Registro de data/hora da inscrição (Uso de timezone-aware recomendado)
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ==========================================================================
    # STATUS E RASTREABILIDADE DE PRESENÇA
    # ==========================================================================
    # Flag de confirmação de presença (Check-in)
    is_present = Column(Boolean, default=False)
    
    # Registra o momento exato da validação física no evento
    present_at = Column(DateTime, nullable=True)

    # ==========================================================================
    # MAPEAMENTO ORM (RELATIONSHIP MAPPING)
    # ==========================================================================
    # Permite acesso direto aos objetos relacionados: enrollment.event.name
    user = relationship("UserModel")
    event = relationship("EventModel")