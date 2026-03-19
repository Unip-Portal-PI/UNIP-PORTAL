from sqlalchemy import Column, String, text
from app.core.database import Base


class CursoModel(Base):
    __tablename__ = "curso"

    id_curso = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome_curso = Column(String(100), nullable=False, unique=True)
