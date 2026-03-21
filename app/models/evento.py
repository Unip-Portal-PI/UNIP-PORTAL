from sqlalchemy import Column, String, Integer, Date, DateTime, Time, Enum, ForeignKey, text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.core.enums import Turno, TipoInscricao, Visibilidade


class EventoCurso(Base):
    __tablename__ = "evento_curso"

    id_evento = Column(String(36), ForeignKey("evento.id_evento", ondelete="CASCADE"), primary_key=True)
    id_curso = Column(String(36), ForeignKey("curso.id_curso", ondelete="CASCADE"), primary_key=True)


class EventoPalestrante(Base):
    __tablename__ = "evento_palestrante"

    id_evento = Column(String(36), ForeignKey("evento.id_evento", ondelete="CASCADE"), primary_key=True)
    id_palestrante = Column(String(36), ForeignKey("palestrante.id_palestrante", ondelete="CASCADE"), primary_key=True)


class EventoModel(Base):
    __tablename__ = "evento"

    id_evento = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    nome = Column(String(200), nullable=False)
    descricao = Column(String(2000), nullable=True)
    descricao_breve = Column(String(120), nullable=True)
    banner_url = Column(String(500), nullable=True)
    data = Column(Date, nullable=False)
    horario = Column(Time, nullable=True)
    turno = Column(Enum(Turno, values_callable=lambda x: [e.value for e in x]), nullable=True)
    id_sala = Column(String(36), ForeignKey("sala.id_sala"), nullable=True)
    vagas = Column(Integer, nullable=True)
    data_limite_inscricao = Column(Date, nullable=True)
    tipo_inscricao = Column(Enum(TipoInscricao, values_callable=lambda x: [e.value for e in x]), default=TipoInscricao.INTERNA, nullable=False)
    url_externa = Column(String(500), nullable=True)
    visibilidade = Column(Enum(Visibilidade, values_callable=lambda x: [e.value for e in x]), default=Visibilidade.PUBLICA, nullable=False)
    id_criador = Column(String(36), ForeignKey("usuario.id_usuario"), nullable=True)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    data_atualizacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    sala = relationship("SalaModel", lazy="joined")
    cursos = relationship("CursoModel", secondary="evento_curso", lazy="joined")
    palestrantes = relationship("PalestranteModel", secondary="evento_palestrante", lazy="joined")
    anexos = relationship("AnexoModel", back_populates="evento", lazy="joined", cascade="all, delete-orphan")
    inscricoes = relationship("InscricaoModel", back_populates="evento", lazy="noload")
    criador = relationship("UsuarioModel", foreign_keys=[id_criador], lazy="joined")
