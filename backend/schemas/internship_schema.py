from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# ==============================================================================
# SCHEMAS DE OPORTUNIDADES DE ESTÁGIO (INTERNSHIP DTOs)
# ==============================================================================
class InternshipCreate(BaseModel):
    """
    Schema de Entrada (POST/PUT).
    Define os dados necessários para cadastrar uma nova vaga no mural.
    O campo 'end_date' é opcional para casos de vagas com prazo indeterminado.
    """
    company: str
    position: str
    description: Optional[str] = None
    location: str
    start_date: datetime
    end_date: Optional[datetime] = None


class InternshipResponse(BaseModel):
    """
    Schema de Saída (GET).
    Retorna os dados da vaga incluindo o ID gerado pelo banco.
    A configuração 'from_attributes' permite a conversão direta do modelo SQLAlchemy.
    """
    id: int
    company: str
    position: str
    description: Optional[str] = None
    location: str
    start_date: datetime
    end_date: Optional[datetime] = None

    # Configuração moderna para Pydantic V2
    model_config = ConfigDict(from_attributes=True)