from sqlalchemy import Column, String, DateTime, text
from datetime import datetime
from app.core.database import Base
from app.core.datetime_utils import get_now_br


class CursoModel(Base):
    __tablename__ = "curso"

    id_curso = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome_curso = Column(String(100), nullable=False, unique=True)
    data_criacao = Column(DateTime, default=get_now_br, nullable=False)
    data_atualizacao = Column(DateTime, default=get_now_br, onupdate=get_now_br, nullable=False)
