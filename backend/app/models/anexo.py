from sqlalchemy import Column, String, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class AnexoModel(Base):
    __tablename__ = "anexo"

    id_anexo = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    id_evento = Column(String(36), ForeignKey("evento.id_evento", ondelete="CASCADE"), nullable=False)
    nome = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    evento = relationship("EventoModel", back_populates="anexos")
