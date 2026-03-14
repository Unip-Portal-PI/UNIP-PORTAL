from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# ==============================================================================
# SCHEMA DE RESPOSTA DE AUDITORIA (DATA TRANSFER OBJECT)
# ==============================================================================
class AuditLogResponse(BaseModel):
    """
    Define a estrutura de dados para o retorno de logs de auditoria via API.
    Garante que os tipos de dados sejam validados e convertidos para JSON 
    de forma segura.
    """
    
    # Identificador único do log
    id: int
    
    # ID do usuário que realizou a ação (mantido como string para flexibilidade)
    user_id: str
    
    # Tipo de operação realizada (Ex: 'CREATE', 'UPDATE', 'DELETE')
    action: str
    
    # Nome da entidade/tabela afetada
    table_name: str
    
    # Detalhamento da alteração (Pode ser nulo caso não haja descrição adicional)
    description: Optional[str]
    
    # Data e hora exata do registro
    timestamp: datetime

    # ==========================================================================
    # CONFIGURAÇÃO DE COMPATIBILIDADE (PYDANTIC V2)
    # ==========================================================================
    class Config:
        """
        Permite que o Pydantic leia dados diretamente de objetos do SQLAlchemy
        (ex: AuditLogModel) em vez de apenas dicionários.
        """
        from_attributes = True