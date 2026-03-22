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
    
    # Área/curso usado para filtrar comunicados no feed (@João)
    area: Optional[str] = Field(None, max_length=100, description="Área ou curso do comunicado")
    
    # Data limite de exibição do comunicado.
    # Após o prazo, o item pode ser marcado como Expirado.
    expires_at: Optional[datetime] = Field(None, description="Data de validade do comunidado")


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
    status: str  # <--- (@Gabriel)
    author_id: int  
    version: int    
    area: str  # (@Joao)

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

class NewsReadCreate(BaseModel): # (@Gabriel)
    """ 
    Schema de Criação de Log de Leitura.
    Registra a leitura de um aviso por um usuário específico.
    """
    news_id: int
   # user_id: int  # O ID do usuário pode ser inferido a partir do token de autenticação
