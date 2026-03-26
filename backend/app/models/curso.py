from sqlalchemy import Column, String, DateTime, text
from datetime import datetime, timezone
from app.core.database import Base


class CursoModel(Base):
    __tablename__ = "curso"

    id_curso = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome_curso = Column(String(100), nullable=False, unique=True)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    data_atualizacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
