from sqlalchemy import Column, String, Boolean, DateTime, text
from datetime import datetime
from app.core.database import Base
from app.core.datetime_utils import get_now_br


class PalestranteModel(Base):
    __tablename__ = "palestrante"

    id_palestrante = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome = Column(String(150), nullable=False)
    bio = Column(String(500), nullable=True)
    instituicao = Column(String(150), nullable=True)
    foto_url = Column(String(500), nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    data_criacao = Column(DateTime, default=get_now_br, nullable=False)
    data_atualizacao = Column(DateTime, default=get_now_br, onupdate=get_now_br, nullable=False)
