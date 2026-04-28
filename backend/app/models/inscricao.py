from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint, text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.core.datetime_utils import get_now_br


class InscricaoModel(Base):
    __tablename__ = "inscricao"
    __table_args__ = (
        UniqueConstraint("id_evento", "id_usuario", name="uq_inscricao_usuario_evento"),
    )

    id_inscricao = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    id_evento = Column(String(36), ForeignKey("evento.id_evento", ondelete="CASCADE"), nullable=False)
    id_usuario = Column(String(36), ForeignKey("usuario.id_usuario"), nullable=False)
    qr_code_usuario = Column(Text, nullable=True)
    data_inscricao = Column(DateTime, default=get_now_br, nullable=False)

    evento = relationship("EventoModel", back_populates="inscricoes")
    usuario = relationship("UsuarioModel", lazy="joined")
    # Deixamos o banco (ON DELETE CASCADE) cuidar da remocao de presenca
    # quando a inscricao for excluida.
    presenca = relationship(
        "PresencaModel",
        back_populates="inscricao",
        uselist=False,
        lazy="joined",
        passive_deletes=True,
    )
