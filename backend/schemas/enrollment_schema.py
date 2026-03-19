from pydantic import BaseModel, ConfigDict, model_validator
from datetime import datetime, date
from typing import Optional, List, Union, Any  # 'Any' adicionado aqui para evitar NameError

# ==============================================================================
# SCHEMAS DE INSCRIÇÃO (ENROLLMENT DTOs)
# ==============================================================================

class EnrollmentCreate(BaseModel):
    """Schema de Entrada (POST). O user_id é extraído do token JWT no Router."""
    event_id: int


class AttendanceCheck(BaseModel):
    """Schema de Validação de Presença via QR Code."""
    qr_code_token: str


class EnrollmentResponse(BaseModel):
    """
    Schema de Saída Geral com Flattening.
    Mapeia dados de objetos relacionados (Event e User) para o JSON de resposta.
    """
    id: int
    user_id: int
    event_id: int
    qr_code_token: str
    enrolled_at: datetime
    is_present: bool
    present_at: Optional[datetime] = None
    
    # Campos "Achatados" (Extraídos dos relacionamentos para facilitar o Front-end)
    event_name: Optional[str] = None
    event_scheduled_date: Optional[date] = None
    event_start_time: Optional[str] = None
    student_name: Optional[str] = None
    student_code: Optional[str] = None 

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_related_data(cls, data: Any) -> Any:
        """
        Lógica de extração: Converte objetos do SQLAlchemy para o formato do Schema.
        """
        # 1. Extração de dados do Evento (Referente ao EventModel)
        event = getattr(data, "event", None)
        if event:
            # Mapeia 'title' do model para 'event_name' do schema
            if not getattr(data, "event_name", None):
                setattr(data, "event_name", getattr(event, "title", None))
            
            # Mapeia 'event_date' (data) e 'start_time' (hora) do EventModel (Inglês)
            if not getattr(data, "event_scheduled_date", None):
                setattr(data, "event_scheduled_date", getattr(event, "event_date", None))
            
            if not getattr(data, "event_start_time", None):
                setattr(data, "event_start_time", getattr(event, "start_time", None))

        # 2. Extração de dados do Usuário (Referente ao UserModel)
        user = getattr(data, "user", None)
        if user:
            # Sincronizado com os nomes reais das colunas no banco (name e registration_number)
            setattr(data, "student_name", getattr(user, "name", None))
            setattr(data, "student_code", getattr(user, "registration_number", None))

        return data

# ==============================================================================
# SCHEMAS DE RELATÓRIO E RESPOSTA RICA (STAFF/ADMIN ONLY)
# ==============================================================================

class AttendanceDetail(BaseModel):
    """Detalhes simplificados para a lista de presença no relatório."""
    name: str
    registration: str
    area: str
    is_present: bool
    confirmed_at: Optional[datetime] = None


class EventAttendanceReport(BaseModel):
    """
    Schema para o Relatório Consolidado de um Evento.
    Utilizado por Staff e Admin para gestão de presença.
    """
    event_title: str
    total_enrolled: int
    total_present: int
    attendees: List[AttendanceDetail]

    model_config = ConfigDict(from_attributes=True)