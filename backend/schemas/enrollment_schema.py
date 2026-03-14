from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

# ==============================================================================
# SCHEMAS DE INSCRIÇÃO (ENROLLMENT DTOs)
# ==============================================================================
class EnrollmentCreate(BaseModel):
    """
    Schema de Entrada (POST).
    Recebe apenas o ID do evento, pois o user_id 
    geralmente é extraído do token JWT no Controller.
    """
    event_id: int


class AttendanceCheck(BaseModel):
    """
    Schema de Validação (PUT/PATCH).
    O staff envia apenas o token lido do QR Code 
    para confirmar a presença.
    """
    qr_code_token: str


class EnrollmentResponse(BaseModel):
    """
    Schema de Saída (GET).
    Fornece o status completo da inscrição.
    Inclui dados "achatados" (flattened) do evento para simplificar o JSON.
    """
    id: int
    user_id: int
    event_id: int
    qr_code_token: str
    enrolled_at: datetime
    is_present: bool
    present_at: Optional[datetime] = None
    
    # ==========================================================================
    # CAMPOS DE CONVENIÊNCIA (DASHBOARD)
    # ==========================================================================
    # Facilitam a renderização no Front-end sem exigir novas chamadas de API
    event_name: Optional[str] = None
    event_date: Optional[datetime] = None

    # Configuração Pydantic V2
    model_config = ConfigDict(from_attributes=True)