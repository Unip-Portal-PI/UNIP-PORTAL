from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

# ==============================================================================
# SCHEMAS DE OPORTUNIDADES DE ESTÁGIO (INTERNSHIP DTOs)
# ==============================================================================
class InternshipBase(BaseModel):
    """Base para evitar repetição de campos entre Create e Response."""
    company: str = Field(..., min_length=2, max_length=100)
    position: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    location: str = Field(..., max_length=100)
    start_date: datetime
    end_date: Optional[datetime] = None

class InternshipCreate(InternshipBase):
    """
    Schema de Entrada (POST).
    Nota: O 'author_id' não está aqui porque será injetado pelo Token JWT no Backend.
    """
    pass

class InternshipUpdate(InternshipBase):
    """Schema para atualização, incluindo o controle de versão (@Gabriel)."""
    current_version: int = Field(..., description="Versão atual para evitar conflitos")

class InternshipResponse(InternshipBase):
    """
    Schema de Saída (GET).
    Inclui campos de governança e rastro de auditoria (@Gabriel).
    """
    id: int
    status: str          # Ativo, Encerrado, Excluido
    is_active: bool
    author_id: int       # ID de quem postou a vaga
    version: int
    created_at: datetime

    # Configuração moderna para Pydantic V2
    model_config = ConfigDict(from_attributes=True)