from sqlalchemy import Column, String, Boolean, text
from app.core.database import Base


class PalestranteModel(Base):
    __tablename__ = "palestrante"

    id_palestrante = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome = Column(String(150), nullable=False)
    bio = Column(String(500), nullable=True)
    instituicao = Column(String(150), nullable=True)
    foto_url = Column(String(500), nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
