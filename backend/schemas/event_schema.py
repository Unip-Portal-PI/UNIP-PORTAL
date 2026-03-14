from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# ==============================================================================
# SCHEMAS DE EVENTOS E SIMPÓSIOS (EVENT DTOs)
# ==============================================================================
class EventCreate(BaseModel):
    """
    Schema de Entrada (POST/PUT).
    Define os campos necessários para criar ou atualizar um evento.
    O campo 'date' é mapeado para 'event_date' no repositório.
    """
    name: str
    description: Optional[str] = None
    location: str
    date: datetime
    time: str
    enrollment_info: Optional[str] = None


class EventResponse(BaseModel):
    """
    Schema de Saída (GET).
    Representa o evento como ele está estruturado no banco de dados.
    Utilizado em listagens gerais e detalhes do evento.
    """
    id: int
    name: str
    description: Optional[str] = None
    location: str
    event_date: datetime
    time: str
    enrollment_info: Optional[str] = None

    # Configuração para compatibilidade com SQLAlchemy (Pydantic V2)
    model_config = ConfigDict(from_attributes=True)