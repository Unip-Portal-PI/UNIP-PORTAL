from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from persistence.database import get_db
from core.security import RoleChecker, oauth2_scheme, settings
from business.services.news_service import NewsService
from persistence.repositories.news_repository import NewsRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.news_schema import NewsCreate, NewsResponse, NewsReadCreate, NewsReadResponse
from persistence.models.news_model import NewsModel
from datetime import datetime, timezone

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE NOTÍCIAS (EDITORIAL ROUTER)
# ==============================================================================
# AJUSTE: Removido prefix="/news" para não duplicar com a configuração do main.py
router = APIRouter(tags=["Notícias"]) 

# AJUSTE: Nomes das roles sincronizados com o banco de dados
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
def list_news(skip: int = 0, limit: int = 5, area: str | None = None, db: Session = Depends(get_db)):
    service = NewsService(NewsRepository(db), AuditRepository(db))
    return service.list_news(skip=skip, limit=limit, area=area)

# ENDPOINT DE REGISTRO DE LEITURA DE NOTÍCIAS (RN09) - ATUALIZADO
@router.post(
    "/read", 
    response_model=NewsReadResponse, 
    summary="Registra leitura do aluno"
)
def register_news_read(
    news_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Registra que o usuário logado leu a notícia. 
    Atende ao requisito de Rastro de Auditoria injetado na lógica.
    """
    repo = NewsRepository(db)
    # Registra a leitura vinculando a notícia ao ID do usuário extraído do Token
    log = repo.register_read(news_id=news_id, user_id=current_user_id)
    return log

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
    current_user_id: int = Depends(get_current_user_id)
):
    """Cria uma nova notícia vinculada ao Admin/Staff logado."""
    
    if news.expires_at and news.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="A data de validade não pode ser anterior ou igual à data atual"
        )
    
    new_post = NewsModel(
        title=news.title, 
        content=news.content, 
        image_url=news.image_url,
        area=news.area,
        expires_at=news.expires_at,
        status="Ativo" # Define o status como "Ativo" por padrão (RN04) <-- ATUALIZADO (@Gabriel)
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
    
    # Passamos "admin" para manter a coerência da lógica de serviço
    result = service.delete_news(news_id, current_user_id, "admin")
    
    if not result:
        raise HTTPException(status_code=404, detail="Comunicado não encontrado.")
    
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="Permissão insuficiente.")
    
    return {"status": "success", "message": "Notícia removida."}