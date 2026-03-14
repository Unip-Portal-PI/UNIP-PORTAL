from sqlalchemy import Column, Integer, String, DateTime
from persistence.database import Base

# ==============================================================================
# DEFINIÇÃO DA ENTIDADE DE EVENTOS (CORE CONTENT)
# ==============================================================================
class EventModel(Base):
    """
    Modelo de representação dos eventos acadêmicos.
    Contém as informações de logística, cronograma e diretrizes de inscrição
    que alimentam o feed principal da aplicação.
    """
    
    # Nome físico da tabela no esquema do Banco de Dados
    __tablename__ = "events"

    # ==========================================================================
    # IDENTIFICADORES E CHAVES
    # ==========================================================================
    # Chave primária autoincrementada para indexação rápida
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================================================
    # ATRIBUTOS DE IDENTIFICAÇÃO E CONTEÚDO
    # ==========================================================================
    # Nome oficial do evento (Ex: "Semana de Tecnologia 2026")
    name = Column(String(100), nullable=False)
    
    # Detalhamento ou resumo do evento
    description = Column(String(255))

    # ==========================================================================
    # LOGÍSTICA E CRONOGRAMA
    # ==========================================================================
    # Endereço físico ou link da sala virtual
    location = Column(String(255))
    
    # Data da realização (Usada para ordenação e filtros no Service)
    event_date = Column(DateTime, nullable=False)
    
    # Texto descritivo para o horário (Ex: "19:00 às 22:00")
    time = Column(String(50))

    # ==========================================================================
    # METADADOS E MÍDIA
    # ==========================================================================
    # Instruções adicionais para os alunos
    enrollment_info = Column(String(255))
    
    # Caminho do arquivo de imagem salvo pelo StorageService
    banner_url = Column(String(255), nullable=True)