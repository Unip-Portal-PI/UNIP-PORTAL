from sqlalchemy import Column, String, Boolean, Date, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class UsuarioModel(Base):
    __tablename__ = "usuario"

    id_usuario = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    id_nivel = Column(String(36), ForeignKey("nivel_acesso.id_nivel"), nullable=False)
    id_curso = Column(String(36), ForeignKey("curso.id_curso"), nullable=True)
    nome = Column(String(150), nullable=False)
    apelido = Column(String(100), nullable=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(150), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    telefone = Column(String(20), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    otp_code = Column(String(5), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    nivel_acesso = relationship("NivelAcessoModel", lazy="joined")
    curso = relationship("CursoModel", lazy="joined")
