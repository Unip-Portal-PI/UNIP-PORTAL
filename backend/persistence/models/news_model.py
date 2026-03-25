from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, text
from sqlalchemy.orm import relationship
from persistence.database import Base

# ==============================================================================
# DEFINIÇÃO DA ENTIDADE DE NOTÍCIAS (EDITORIAL CONTENT)
# ==============================================================================
class NewsModel(Base):
    """
    Modelo consolidado para gestão de notícias e comunicados oficiais.
    Implementa UUID para identificação, soft delete, controle de versão 
    e suporte a anexos e visibilidade via JSON.
    """
    
    __tablename__ = "news"

    # ==========================================================================
    # IDENTIFICADORES E CHAVES (UUID para maior segurança em APIs)
    # ==========================================================================
    id = Column(String(36), primary_key=True, server_default=text("(UUID())"))
    
    # ==========================================================================
    # CONTEÚDO EDITORIAL
    # ==========================================================================
    title = Column(String(200), nullable=False)
    subject = Column(String(120), nullable=True)  # Assunto/Categoria
    summary = Column(String(255), nullable=False)  # Resumo para listagens
    content = Column(Text, nullable=False)
    
    # URLs de mídia (Text para evitar limitação de caracteres em URLs longas)
    image_url = Column(Text, nullable=True)
    
    # Atributos dinâmicos e anexos
    attachments = Column(JSON, nullable=False, default=list)  # Lista de arquivos
    visibility = Column(JSON, nullable=False, default=dict)    # Regras de quem pode ver

    # ==========================================================================
    # METADADOS E CONTROLE DE ESTADO
    # ==========================================================================
    # Datas com timezone-aware
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    expires_at = Column(DateTime, nullable=True)  # Data de validade da notícia
    
    # Soft Delete
    is_active = Column(Boolean, default=True, nullable=False)

    # ==========================================================================
    # GOVERNANÇA E INTEGRIDADE
    # ==========================================================================
    # Relacionamento com o autor (ajustar 'users.id' conforme seu banco)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Controle de Versão (Optimistic Locking)
    version = Column(Integer, default=1)

    # ==========================================================================
    # RELACIONAMENTOS (ORM MAPPING)
    # ==========================================================================
    # lazy="joined" carrega o autor automaticamente em uma única query (mais eficiente)
    author = relationship("UserModel", foreign_keys=[author_id], lazy="joined")