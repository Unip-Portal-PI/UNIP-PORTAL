from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# ==============================================================================
# SCHEMAS DE NOTÍCIAS (EDITORIAL GOVERNANCE DTOs)
# ==============================================================================
class NewsBase(BaseModel):
    """
    Camada Base: Define as regras de integridade de conteúdo.
    Proteção contra inputs inválidos que prejudicam a UI/UX.
    """
    title: str = Field(..., min_length=5, max_length=150, description="Título do comunicado")
    content: str = Field(..., min_length=10, description="Conteúdo detalhado da notícia")
    
    # Validação passiva: Opcional, mas se enviado, deve ser uma string coerente
    image_url: Optional[str] = Field(None, description="Link para imagem de destaque")


class NewsCreate(NewsBase):
    """
    Schema de Criação (POST).
    Implementa a criação simplificada de avisos oficiais.
    """
    pass


class NewsUpdate(NewsBase):
    """
    Schema de Atualização (PUT/PATCH).
    Implementa Concorrência Otimista no lado do Cliente.
    Exige a versão atual para validar o estado do registro.
    """
    current_version: int = Field(..., description="Versão atual para evitar sobrescrita cega")


class NewsResponse(NewsBase):
    """
    Schema de Saída (GET).
    Provê rastreabilidade de autoria e controle de versão para o Front-end.
    """
    id: int
    created_at: datetime
    is_active: bool
    author_id: int  
    version: int    

    class Config:
        from_attributes = True


class NewsReadResponse(BaseModel):
    """ 
    Schema de Log de Leitura.
    Base de dados para a inteligência de exclusão condicional.
    """
    news_id: int
    user_id: int
    read_at: datetime

    class Config:
        from_attributes = True