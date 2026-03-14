from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from persistence.database import Base
from datetime import datetime, timezone

# ==============================================================================
# DEFINIÇÃO DO LOG DE LEITURA (ANALYTICS & COMPLIANCE)
# ==============================================================================
class NewsReadLogModel(Base):
    """
    Modelo para rastreamento de visualização de conteúdo.
    Implementa Registro de Leitura e serve como base 
    para a Lógica de Exclusão Condicional/Soft Delete.
    """

    # Nome físico da tabela no Banco de Dados
    __tablename__ = "news_read_logs"

    # ==========================================================================
    # IDENTIFICADORES E CHAVES
    # ==========================================================================
    # Chave primária autoincrementada
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================================================
    # VÍNCULOS E INTEGRIDADE (FOREIGN KEYS)
    # ==========================================================================
    # Referência à notícia lida. 
    # O CASCADE garante que, se a notícia for deletada fisicamente, o log também seja.
    news_id = Column(Integer, ForeignKey("news.id", ondelete="CASCADE"), nullable=False)
    
    # Referência ao usuário que realizou a leitura.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # ==========================================================================
    # METADADOS DE EVENTO (TRACKING)
    # ==========================================================================
    # Registro temporal exato da leitura (Uso de timezone-aware para precisão)
    read_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ==========================================================================
    # RELACIONAMENTOS (OPTIONAL ORM MAPPING)
    # ==========================================================================
    # Permite carregar os dados da notícia ou usuário a partir do log, se necessário
    news = relationship("NewsModel")
    user = relationship("UserModel")