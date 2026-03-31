from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, ForeignKey, String, text
from sqlalchemy.orm import relationship

from app.core.database import Base


class EventoCancelamentoAvisoModel(Base):
    __tablename__ = "evento_cancelamento_aviso"

    id_aviso = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    id_usuario = Column(String(36), ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    id_evento = Column(String(36), ForeignKey("evento.id_evento", ondelete="CASCADE"), nullable=False)
    evento_nome = Column(String(200), nullable=False)
    evento_data = Column(Date, nullable=False)
    criado_em = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    visualizado_em = Column(DateTime, nullable=True)

    usuario = relationship("UsuarioModel", lazy="joined")
    evento = relationship("EventoModel", lazy="joined")
