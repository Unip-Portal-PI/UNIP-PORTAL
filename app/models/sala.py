from sqlalchemy import Column, String, Integer, DateTime, text
from datetime import datetime, timezone
from app.core.database import Base


class SalaModel(Base):
    __tablename__ = "sala"

    id_sala = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    identificacao = Column(String(100), nullable=False)
    capacidade = Column(Integer, nullable=False)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    data_atualizacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
