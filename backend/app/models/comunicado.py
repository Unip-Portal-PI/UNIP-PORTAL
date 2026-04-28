from datetime import datetime
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, JSON, String, Text, text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.datetime_utils import get_now_br


class ComunicadoModel(Base):
    __tablename__ = "comunicado"

    id_comunicado = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    titulo = Column(String(200), nullable=False)
    assunto = Column(String(120), nullable=True)
    conteudo = Column(Text, nullable=False)
    resumo = Column(String(200), nullable=False)
    banner_url = Column(Text, nullable=True)
    visibilidade = Column(JSON, nullable=False, default=list)
    anexos = Column(JSON, nullable=False, default=list)
    data_validade = Column(Date, nullable=True)
    id_criador = Column(String(36), ForeignKey("usuario.id_usuario"), nullable=False)
    removido = Column(Boolean, default=False, nullable=False)
    data_criacao = Column(DateTime, default=get_now_br, nullable=False)
    data_atualizacao = Column(
        DateTime,
        default=get_now_br,
        onupdate=get_now_br,
        nullable=False,
    )

    criador = relationship("UsuarioModel", foreign_keys=[id_criador], lazy="joined")
