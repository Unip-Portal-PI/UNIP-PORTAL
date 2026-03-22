from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from persistence.database import Base
from datetime import datetime, timezone

# ==============================================================================
# DEFINIÇÃO DA ENTIDADE DE NOTÍCIAS (EDITORIAL CONTENT)
# ==============================================================================
class NewsModel(Base):
    """
    Modelo de representação dos comunicados e notícias oficiais.
    Gerencia o conteúdo textual, mídias associadas e a rastreabilidade 
    de autoria para controle de governança do conteúdo.
    """
    
    # Nome físico da tabela no Banco de Dados
    __tablename__ = "news"

    # ==========================================================================
    # IDENTIFICADORES E CHAVES
    # ==========================================================================
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================================================
    # CONTEÚDO EDITORIAL
    # ==========================================================================
    title = Column(String(150), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)

    # ==========================================================================
    # METADADOS E CONTROLE DE ESTADO
    # ==========================================================================
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    # Status detalhado conforme RN04 (Ativo, Inativo, Excluido)
    status = Column(String(20), default="Ativo")

    # ==========================================================================
    # GOVERNANÇA E INTEGRIDADE (BUSINESS RULES)
    # ==========================================================================
    # Identifica o autor da postagem (Vínculo com a tabela de usuários)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Controle de Versão: Proteção contra edições simultâneas
    version = Column(Integer, default=1)

    # ==========================================================================
    # RELACIONAMENTOS (ORM MAPPING)
    # ==========================================================================
    # Permite carregar o objeto do autor: news_obj.author.name
    author = relationship("UserModel")
    
    # Permite carregar os registros de leitura associados: news_obj.reads
    reads = relationship("NewsReadModel", back_populates="news", cascade="all, delete-orphan")


# ==========================================================================
# REGISTRO DE LEITURA (AUDITORIA DE CONSUMO) - RN09
# ==========================================================================
class NewsReadModel(Base):
    """
    Modelo de registro de leitura para auditoria de consumo.
    Permite rastrear quais usuários leram quais notícias e quando.
    """
    __tablename__ = "news_reads"

    id = Column(Integer, primary_key=True, index=True)

    # ID da notícia lida (Vínculo com a tabela de notícias)
    news_id = Column(Integer, ForeignKey("news.id"), nullable=False)
        
    # ID do usuário que leu a notícia (Vínculo com a tabela de usuários)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
        
    # Data e hora da leitura
    read_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relacionamentos para facilitar consultas (Inversos)
    news = relationship("NewsModel", back_populates="reads")
    user = relationship("UserModel")