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
    # Chave primária autoincrementada
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================================================
    # CONTEÚDO EDITORIAL
    # ==========================================================================
    # Título chamativo para o comunicado (Ex: "InfoUnity: Novas Vagas de Estágio")
    title = Column(String(150), nullable=False)
    
    # Corpo completo do texto (Tipo Text para suportar grandes volumes de dados)
    content = Column(Text, nullable=False)
    
    # URL da imagem de destaque (Geralmente hospedada no servidor de estáticos)
    image_url = Column(String(255), nullable=True)

    # ==========================================================================
    # METADADOS E CONTROLE DE ESTADO
    # ==========================================================================
    # Data de publicação (Uso de callable para garantir o tempo de execução)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Controle de Soft Delete: Define se a notícia está visível no feed
    is_active = Column(Boolean, default=True)

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