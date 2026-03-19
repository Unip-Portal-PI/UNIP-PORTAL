from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import List, Optional

# ==============================================================================
# SCHEMAS DE ANEXOS (DTOs)
# ==============================================================================

class AttachmentBase(BaseModel):
    name: str = Field(..., description="Nome de exibição do arquivo")
    url: str = Field(..., description="URL pública para download")

class AttachmentCreate(AttachmentBase):
    """Usado para criar anexos junto com o evento"""
    pass

class AttachmentResponse(AttachmentBase):
    """Retorno do anexo contendo o ID do banco de dados"""
    id: int
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# SCHEMAS de EVENTO (DTOs)
# ==============================================================================

class EventBase(BaseModel):
    """
    Schema base com todos os campos em inglês para coincidir com o Form-Data e o Banco.
    """
    title: str = Field(..., min_length=3, description="Título do evento")
    short_description: Optional[str] = Field(None, max_length=120, description="Resumo para cards")
    full_description: Optional[str] = Field(None, description="Descrição detalhada")
    area: str = Field(default="Geral", description="Área acadêmica")
    event_date: date = Field(..., description="Data do evento (AAAA-MM-DD)")
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="Horário no formato HH:mm")
    shift: str = Field(..., description="Turno: Manhã | Tarde | Noite")
    location: str = Field(..., description="Local ou link da sala")
    deadline_date: date = Field(..., description="Data limite para inscrições")
    total_slots: int = Field(..., ge=0, description="Total de vagas (mínimo 0)")
    registration_type: str = Field(default="interna", description="Tipo: interna | externa")
    external_url: Optional[str] = Field(None, description="URL se a inscrição for externa")
    visibility: str = Field(default="publica", description="Visibilidade: publica | privada")
    banner_url: Optional[str] = Field(None, description="Caminho da imagem do banner")

class EventCreate(EventBase):
    """
    Schema de Entrada (POST).
    """
    attachments: Optional[List[AttachmentCreate]] = []

class EventResponse(EventBase):
    """
    Schema de Saída (GET).
    Reflete os campos do modelo do banco de dados.
    """
    id: int
    occupied_slots: int = Field(default=0, description="Vagas já preenchidas")
    is_active: bool = True
    owner_id: int
    created_at: datetime
    
    # Lista de anexos vinculados
    attachments: List[AttachmentResponse] = Field(default=[])

    model_config = ConfigDict(
        from_attributes=True,   # Permite ler dados de objetos ORM (SQLAlchemy)
        populate_by_name=True   # Permite popular usando nomes de campos
    )