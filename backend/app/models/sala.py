from sqlalchemy import Column, String, Integer, DateTime, text
from datetime import datetime
from app.core.database import Base
from app.core.datetime_utils import get_now_br


class SalaModel(Base):
    __tablename__ = "sala"

    id_sala = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    identificacao = Column(String(100), nullable=False)
    capacidade = Column(Integer, nullable=False)
    data_criacao = Column(DateTime, default=get_now_br, nullable=False)
    data_atualizacao = Column(DateTime, default=get_now_br, onupdate=get_now_br, nullable=False)
