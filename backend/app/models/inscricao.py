from sqlalchemy import Column, String, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class InscricaoModel(Base):
    __tablename__ = "inscricao"

    id_inscricao = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    id_evento = Column(String(36), ForeignKey("evento.id_evento", ondelete="CASCADE"), nullable=False)
    id_usuario = Column(String(36), ForeignKey("usuario.id_usuario"), nullable=False)
    qr_code_usuario = Column(String(255), nullable=True, unique=True)
    data_inscricao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    evento = relationship("EventoModel", back_populates="inscricoes")
    usuario = relationship("UsuarioModel", lazy="joined")
    presenca = relationship("PresencaModel", back_populates="inscricao", uselist=False, lazy="joined")
