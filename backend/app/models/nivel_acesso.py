from sqlalchemy import Column, String, text
from app.core.database import Base


class NivelAcessoModel(Base):
    __tablename__ = "nivel_acesso"

    id_nivel = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome_perfil = Column(String(50), nullable=False, unique=True)
    descricao = Column(String(255), nullable=True)
