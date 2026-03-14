from sqlalchemy import Column, Integer, String, DateTime, Text
from persistence.database import Base
import datetime

# ==============================================================================
# DEFINIÇÃO DA TABELA DE AUDITORIA (IMMUTABLE LOGS)
# ==============================================================================
class AuditLogModel(Base):
    """
    Representa o registro histórico de ações críticas no sistema.
    Esta tabela é fundamental para conformidade (compliance) e rastreabilidade,
    permitindo saber quem fez o quê, onde e quando.
    """
    
    # Nome físico da tabela no banco de dados
    __tablename__ = "audit_logs"

    # ==========================================================================
    # CHAVES E IDENTIFICADORES
    # ==========================================================================
    # Identificador único incremental para cada entrada de log
    id = Column(Integer, primary_key=True, index=True)
    
    # Identificador do usuário que realizou a ação (Admin, Aluno ou Colaborador)
    user_id = Column(String(50), nullable=False)

    # ==========================================================================
    # METADADOS DA OPERAÇÃO (PAYLOAD)
    # ==========================================================================
    # Tipo da ação realizada (Ex: CREATE_EVENT, DELETE_USER, UPDATE_INTERNSHIP)
    action = Column(String(50), nullable=False)
    
    # Nome da entidade alvo que sofreu a alteração (Ex: "events", "users")
    table_name = Column(String(50), nullable=False)
    
    # Detalhamento legível da alteração (Ex: "Alterou o local do evento ID 45")
    description = Column(Text, nullable=True)

    # ==========================================================================
    # REGISTRO TEMPORAL (TIMELINE)
    # ==========================================================================
    # Marca temporal automática da ocorrência no servidor.
    timestamp = Column(DateTime, default=datetime.datetime.now)