from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from persistence.database import get_db
from core.security import RoleChecker, oauth2_scheme, settings
from business.services.news_service import NewsService
from persistence.repositories.news_repository import NewsRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.news_schema import NewsCreate, NewsResponse, NewsUpdate
from persistence.models.news_model import NewsModel

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE NOTÍCIAS (EDITORIAL ROUTER)
# ==============================================================================
router = APIRouter()

require_staff = RoleChecker(["admin", "staff"])

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """Extrai o ID (UUID) do usuário de forma segura."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return str(user_id) # Retorna como string para compatibilidade com UUID
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")

# ==============================================================================
# SEÇÃO DE CONSULTAS (PUBLIC FEED)
# ==============================================================================
@router.get(
    "/", 
    # List[NewsResponse] agora aceita os novos campos automaticamente
    response_model=list[NewsResponse],
    summary="Lista comunicados ativos",
    tags=["Notícias"]
)
def list_news(skip: int = 0, limit: int = 5, db: Session = Depends(get_db)):
    service = NewsService(NewsRepository(db), AuditRepository(db))
    return service.list_news(skip=skip, limit=limit)

# ==============================================================================
# SEÇÃO DE GESTÃO (EDITORIAL ADMIN)
# ==============================================================================
@router.post(
    "/", 
    response_model=NewsResponse, 
    dependencies=[Depends(require_staff)],
    summary="Publica um novo comunicado oficial",
    tags=["Notícias"]
)
def create_news(
    news: NewsCreate, 
    db: Session = Depends(get_db), 
    current_user_id: str = Depends(get_current_user_id)
):
    """Cria uma nova notícia incluindo os novos campos editoriais."""
    # Mapeamento atualizado para incluir summary, subject e campos JSON
    new_post = NewsModel(
        title=news.title,
        subject=news.subject,
        summary=news.summary,
        content=news.content, 
        image_url=news.image_url,
        attachments=news.attachments,
        visibility=news.visibility
    )
    
    service = NewsService(NewsRepository(db), AuditRepository(db))
    return service.create_news(new_post, current_user_id)

@router.patch(
    "/{news_id}",
    response_model=NewsResponse,
    dependencies=[Depends(require_staff)],
    summary="Atualiza um comunicado existente",
    tags=["Notícias"]
)
def update_news(
    news_id: str, # UUID como string
    news_data: NewsUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Atualiza a notícia com suporte a concorrência otimista (versão)."""
    service = NewsService(NewsRepository(db), AuditRepository(db))
    updated_news = service.update_news(news_id, news_data, current_user_id)
    
    if not updated_news:
        raise HTTPException(status_code=404, detail="Notícia não encontrada ou conflito de versão.")
    
    return updated_news

@router.delete(
    "/{news_id}", 
    dependencies=[Depends(require_staff)],
    summary="Remove um comunicado",
    tags=["Notícias"]
)
def delete_news(
    news_id: str, # Alterado para str (UUID)
    db: Session = Depends(get_db), 
    current_user_id: str = Depends(get_current_user_id)
):
    """Remove uma notícia registrando quem realizou a exclusão."""
    service = NewsService(NewsRepository(db), AuditRepository(db))
    
    result = service.delete_news(news_id, current_user_id, "admin")
    
    if not result:
        raise HTTPException(status_code=404, detail="Comunicado não encontrado.")
    
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="Permissão insuficiente.")
    
    return {"status": "success", "message": "Notícia removida."}