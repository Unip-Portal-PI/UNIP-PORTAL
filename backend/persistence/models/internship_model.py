from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from persistence.database import Base
from datetime import datetime, timezone

# ==============================================================================
# DEFINIÇÃO DA ENTIDADE DE ESTÁGIOS (CAREER OPPORTUNITIES)
# ==============================================================================
class InternshipModel(Base):
    """
    Modelo de representação das vagas de estágio e emprego.
    Gerencia os detalhes do contratante, os requisitos da vaga e
    o ciclo de vida (publicação/arquivamento) da oportunidade.
    """
    
    # Nome físico da tabela no Banco de Dados
    __tablename__ = "internships"

    # ==========================================================================
    # IDENTIFICADORES E CHAVES
    # ==========================================================================
    # Chave primária autoincrementada para consultas rápidas
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================================================
    # PERFIL DA OPORTUNIDADE (EMPRESA E CARGO)
    # ==========================================================================
    # Nome da instituição ou empresa contratante (Ex: Google, InfoUnity Corp)
    company = Column(String(100), nullable=False)
    
    # Título da vaga (Ex: "Estagiário de Backend")
    position = Column(String(100), nullable=False)
    
    # Detalhamento rico de requisitos, benefícios e atividades
    description = Column(Text)
    
    # Localização (Cidade/UF ou indicação de "Remoto")
    location = Column(String(100))

    # ==========================================================================
    # VIGÊNCIA E CRONOGRAMA
    # ==========================================================================
    # Data de abertura da vaga no sistema
    start_date = Column(DateTime, nullable=False)
    
    # Data limite para candidatura (Opcional)
    end_date = Column(DateTime, nullable=True)

    # ==========================================================================
    # STATUS E RASTREABILIDADE
    # ==========================================================================
    # Controle de exibição (Soft Delete): Define se a vaga está visível no feed
    is_active = Column(Boolean, default=True) 

    # Status detalhado: Ativo, Encerrado, Excluido
    status = Column(String(20), default="Ativo")
    
    # Rastro de auditoria: Identifica quem (Admin/Staff) criou a vaga
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
   
    # Registro automático do momento da criação da vaga (UTC)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Controle de Versão: Proteção contra edições simultâneas (Concorrência Otimista)
    version = Column(Integer, default=1)

    # ==========================================================================
    # RELACIONAMENTOS (ORM MAPPING)
    # ==========================================================================
    # Permite acessar os dados do autor da vaga: internship.author.name
    author = relationship("UserModel")