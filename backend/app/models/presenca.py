from sqlalchemy import Column, String, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.core.datetime_utils import get_now_br


class PresencaModel(Base):
    __tablename__ = "presenca"

    id_presenca = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    id_inscricao = Column(String(36), ForeignKey("inscricao.id_inscricao", ondelete="CASCADE"), nullable=False, unique=True)
    confirmado_por = Column(String(36), ForeignKey("usuario.id_usuario"), nullable=True)
    data_hora_registro = Column(DateTime, default=get_now_br, nullable=False)

    inscricao = relationship("InscricaoModel", back_populates="presenca")
