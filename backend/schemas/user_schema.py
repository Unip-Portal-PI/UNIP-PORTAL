from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import date, datetime
import re

# ==============================================================================
# SCHEMAS DE ANEXOS (DTOs)
# ==============================================================================

class AttachmentBase(BaseModel):
    name: str = Field(..., description="Nome de exibição do arquivo")
    url: str = Field(..., description="URL pública para download")

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentResponse(AttachmentBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ==============================================================================
# SCHEMAS DE EVENTOS (DTOs)
# ==============================================================================

class EventBase(BaseModel):
    """
    Schema base para eventos correspondente ao Modelo do Banco de Dados.
    """
    title: str = Field(..., min_length=3)
    short_description: Optional[str] = Field(None, max_length=120)
    full_description: Optional[str] = Field(None)
    area: str = Field(default="All")
    event_date: date = Field(...)
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$") # Formato HH:mm
    shift: str = Field(...) # Manhã | Tarde | Noite
    location: str = Field(...)
    deadline_date: date = Field(...)
    total_slots: int = Field(..., ge=0)
    registration_type: str = Field(default="internal") # interno | externo
    external_url: Optional[str] = Field(None)
    visibility: str = Field(default="public") # público | privado
    banner_url: Optional[str] = Field(None)

class EventCreate(EventBase):
    attachments: Optional[List[AttachmentCreate]] = []

class EventResponse(EventBase):
    id: int
    occupied_slots: int = Field(default=0)
    is_active: bool = True
    owner_id: int
    created_at: datetime
    updated_at: datetime
    
    # Lista de anexos vinculados
    attachments: List[AttachmentResponse] = Field(default=[])

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

# ==============================================================================
# SCHEMAS DE USUÁRIO (DTOs)
# ==============================================================================

class UserCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    nickname: str = Field(..., min_length=2, max_length=50)
    registration_number: str = Field(..., min_length=5, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=8)
    area: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    birth_date: Optional[date] = None

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra maiúscula.")
        if not re.search(r"[a-z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra minúscula.")
        if not re.search(r"\d", v):
            raise ValueError("A senha deve conter pelo menos um número.")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v:
            return re.sub(r"\D", "", v)
        return v

class UserResponse(BaseModel):
    id: int
    name: str
    nickname: str
    registration_number: str
    email: EmailStr
    area: str
    phone: Optional[str]
    birth_date: Optional[date]
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class UserUpdateSelf(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    nickname: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    area: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v:
            return re.sub(r"\D", "", v)
        return v

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        return UserCreate.password_complexity(v)
# ==============================================================================
# NOVOS SCHEMAS DE AUTENTICAÇÃO
# ==============================================================================

class UserLogin(BaseModel):
    """Schema para captura de credenciais no login."""
    registration_number: str
    password: str

class UserVerifyOTP(BaseModel):
    """Schema para validação do código de ativação enviado por e-mail."""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

    @field_validator("otp_code")
    @classmethod
    def validate_otp_format(cls, v):
        if not v.isdigit():
            raise ValueError("O código deve conter apenas números.")
        return v