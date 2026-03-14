from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
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
    # Controle de exibição (Soft Delete): Define se a vaga está visível
    is_active = Column(Boolean, default=True) 
    
    # Registro automático do momento da criação da vaga
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))