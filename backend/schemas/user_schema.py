from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
import re

# ==============================================================================
# SCHEMAS DE IDENTIDADE E ACESSO (USER DTOs)
# ==============================================================================
class UserCreate(BaseModel):
    """
    Schema de Cadastro Inicial.
    Implementa validações rigorosas de segurança e integridade de dados.
    """
    name: str = Field(..., min_length=3, max_length=100)
    registration_number: str = Field(..., min_length=5, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = "student"

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v):
        """Regra de Negócio: Validação de força da senha (MFA-ready)."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra maiúscula.")
        if not re.search(r"[a-z]", v):
            raise ValueError("A senha deve conter pelo menos uma letra minúscula.")
        if not re.search(r"\d", v):
            raise ValueError("A senha deve conter pelo menos um número.")
        return v


class UserResponse(BaseModel):
    """
    Schema de Resposta Pública/Interna.
    Omitimos o hash da senha por motivos óbvios de segurança.
    """
    id: int
    name: str
    registration_number: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserUpdateSelf(BaseModel):
    """
    Schema para Atualização de Perfil (Self-Service).
    Campos opcionais para permitir atualizações parciais (PATCH).
    """
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    registration_number: Optional[str] = None


class PasswordUpdate(BaseModel):
    """
    Schema para Troca de Senha.
    Reutiliza a lógica de complexidade do UserCreate (DRY Principle).
    """
    current_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        return UserCreate.password_complexity(v)