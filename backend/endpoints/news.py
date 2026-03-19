from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from persistence.database import get_db
from core.security import RoleChecker, oauth2_scheme, settings
from business.services.news_service import NewsService
from persistence.repositories.news_repository import NewsRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.news_schema import NewsCreate, NewsResponse
from persistence.models.news_model import NewsModel

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE NOTÍCIAS (EDITORIAL ROUTER)
# ==============================================================================
router = APIRouter()

# AJUSTE: Nomes das roles sincronizados com o banco de dados (users.py)
require_staff = RoleChecker(["admin", "staff"])

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """Extrai o ID do usuário de forma segura e padronizada."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")

# ==============================================================================
# SEÇÃO DE CONSULTAS (PUBLIC FEED)
# ==============================================================================
@router.get(
    "/", 
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
    current_user_id: int = Depends(get_current_user_id) # Uso direto da dependência
):
    """Cria uma nova notícia vinculada ao Admin/Staff logado."""
    new_post = NewsModel(
        title=news.title, 
        content=news.content, 
        image_url=news.image_url
    )
    
    service = NewsService(NewsRepository(db), AuditRepository(db))
    return service.create_news(new_post, current_user_id)

@router.delete(
    "/{news_id}", 
    dependencies=[Depends(require_staff)],
    summary="Remove um comunicado",
    tags=["Notícias"]
)
def delete_news(
    news_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Remove uma notícia registrando quem realizou a exclusão."""
    service = NewsService(NewsRepository(db), AuditRepository(db))
    
    # AJUSTE: Passamos "admin" para manter a coerência da lógica de serviço
    result = service.delete_news(news_id, current_user_id, "admin")
    
    if not result:
        raise HTTPException(status_code=404, detail="Comunicado não encontrado.")
    
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="Permissão insuficiente.")
    
    return {"status": "success", "message": "Notícia removida."}