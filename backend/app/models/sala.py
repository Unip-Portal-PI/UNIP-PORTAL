from sqlalchemy import Column, String, Integer, text
from app.core.database import Base


class SalaModel(Base):
    __tablename__ = "sala"

    id_sala = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    identificacao = Column(String(100), nullable=False)
    capacidade = Column(Integer, nullable=False)
