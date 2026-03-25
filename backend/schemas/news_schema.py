from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional, List, Any, Dict

# ==============================================================================
# SCHEMAS DE NOTÍCIAS (EDITORIAL GOVERNANCE DTOs)
# ==============================================================================

class NewsBase(BaseModel):
    """
    Camada Base: Define as regras de integridade de conteúdo.
    Atualizada com os novos campos de resumo, assunto e mídias.
    """
    title: str = Field(..., min_length=5, max_length=200, description="Título do comunicado")
    subject: Optional[str] = Field(None, max_length=120, description="Assunto ou categoria")
    summary: str = Field(..., min_length=10, max_length=255, description="Resumo para listagens")
    content: str = Field(..., min_length=10, description="Conteúdo completo")
    
    # Usamos str para URLs pois podem ser caminhos relativos ou complexos
    image_url: Optional[str] = Field(None, description="URL da imagem de destaque")
    
    # Novos campos de suporte a dados complexos
    attachments: List[Dict[str, Any]] = Field(default=[], description="Lista de anexos (nome, url)")
    visibility: Dict[str, Any] = Field(default={}, description="Regras de visibilidade")

class NewsCreate(NewsBase):
    """
    Schema de Criação (POST).
    O author_id é enviado aqui (ou capturado via Token no Controller).
    """
    author_id: str = Field(..., description="ID do autor (UUID)")
    expires_at: Optional[datetime] = Field(None, description="Data opcional de expiração")

class NewsUpdate(BaseModel):
    """
    Schema de Atualização (PATCH).
    Permite atualização parcial. Exige current_version para concorrência otimista.
    """
    title: Optional[str] = None
    subject: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    visibility: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    
    current_version: int = Field(..., description="Versão atual no banco para evitar sobrescrita")

class NewsResponse(NewsBase):
    """
    Schema de Saída (GET).
    Reflete as mudanças de UUID e timestamps.
    """
    id: str = Field(..., description="ID único (UUID)")
    author_id: str
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    version: int

    class Config:
        from_attributes = True


class NewsReadResponse(BaseModel):
    """ 
    Schema de Log de Leitura.
    IDs atualizados para String (UUID).
    """
    news_id: str
    user_id: str
    read_at: datetime

    class Config:
        from_attributes = True