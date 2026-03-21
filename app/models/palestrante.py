from sqlalchemy import Column, String, Boolean, DateTime, text
from datetime import datetime, timezone
from app.core.database import Base


class PalestranteModel(Base):
    __tablename__ = "palestrante"

    id_palestrante = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome = Column(String(150), nullable=False)
    bio = Column(String(500), nullable=True)
    instituicao = Column(String(150), nullable=True)
    foto_url = Column(String(500), nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    data_atualizacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
