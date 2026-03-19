from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from persistence.database import Base
from datetime import datetime

# ==============================================================================
# MODELO DE ANEXOS (ATTACHMENTS)
# ==============================================================================

class AttachmentModel(Base):
    """Modelo para anexos de eventos (ex: PDFs, Editais, Guias)"""
    __tablename__ = "event_attachments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)  # Nome de exibição do arquivo
    url = Column(String(500), nullable=False)   # Link de download/acesso
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))

    # Relacionamento reverso com o evento
    event = relationship("EventModel", back_populates="attachments")


# ==============================================================================
# MODELO DE EVENTO (EVENT)
# ==============================================================================

class EventModel(Base):
    """
    Modelo de eventos acadêmicos.
    Sincronizado com requisitos para: vagas, anexos, turnos e visibilidade.
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    
    # Informações Básicas
    title = Column(String(200), nullable=False)
    short_description = Column(String(120), nullable=True) # Resumo para os cards da UI
    full_description = Column(Text, nullable=True)         # Descrição longa (HTML/Markdown)
    banner_url = Column(String(500), nullable=True)
    area = Column(String(100), nullable=False, default="Geral")
    
    # Datas e Horários
    event_date = Column(Date, nullable=False)              # Data do Evento: YYYY-MM-DD
    start_time = Column(String(5), nullable=False)         # Horário: HH:mm
    shift = Column(String(20), nullable=False)             # Manhã | Tarde | Noite
    deadline_date = Column(Date, nullable=False)           # Data limite para inscrição
    
    # Localização e Gestão de Vagas
    location = Column(String(255), nullable=False)
    total_slots = Column(Integer, nullable=False, default=0)
    occupied_slots = Column(Integer, nullable=False, default=0)
    
    # Regras de Inscrição e Visibilidade
    registration_type = Column(String(20), default="internal") # interna | externa
    external_url = Column(String(500), nullable=True)
    visibility = Column(String(20), default="public")          # publica | privada
    
    # Auditoria e Controle
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now(), server_default=func.now())

    # Relacionamentos
    # cascade="all, delete-orphan" remove os anexos automaticamente se o evento for excluído.
    attachments = relationship("AttachmentModel", back_populates="event", cascade="all, delete-orphan")
    
    # Referência ao Modelo de Usuário (Criador do evento)
    owner = relationship("UserModel") 

    # ==========================================================================
    # PROPRIEDADES LÓGICAS (Calculadas em tempo de execução)
    # ==========================================================================

    @property
    def is_expired(self) -> bool:
        """Verifica se a data do evento já passou."""
        return self.event_date < datetime.now().date()

    @property
    def is_registration_closed(self) -> bool:
        """Verifica se o prazo limite de inscrição já encerrou."""
        return self.deadline_date < datetime.now().date()

    @property
    def has_vacancies(self) -> bool:
        """Verifica se ainda existem vagas disponíveis para inscrições internas."""
        return self.occupied_slots < self.total_slots

    @property
    def slots_left(self) -> int:
        """Calcula a quantidade de vagas restantes."""
        remaining = self.total_slots - self.occupied_slots
        return remaining if remaining > 0 else 0