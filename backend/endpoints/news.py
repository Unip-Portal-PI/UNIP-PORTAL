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

# Restrição de Acesso: Apenas Staff pode gerenciar o mural de notícias
require_staff = RoleChecker(["Administrador", "Colaborador"])

def get_current_user_id(token: str) -> str:
    """Extrai de forma segura o ID do usuário (sub) do JWT para a Auditoria."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")

# ==============================================================================
# SEÇÃO DE CONSULTAS (PUBLIC FEED)
# ==============================================================================
@router.get(
    "/", 
    response_model=list[NewsResponse],
    summary="Lista comunicados ativos",
    tags=["Notícias - Visualização"]
)
def list_news(skip: int = 0, limit: int = 5, db: Session = Depends(get_db)):
    """
    Recupera as últimas notícias publicadas.
    Otimizado para o feed principal (Top 5).
    """
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
    tags=["Notícias - Gestão"]
)
def create_news(
    news: NewsCreate, 
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    """
    Cria uma nova notícia. O autor é vinculado via Token JWT.
    """
    current_user_id = get_current_user_id(token)
    
    # Mapeamento Schema -> Model
    new_post = NewsModel(
        title=news.title, 
        content=news.content, 
        image_url=news.image_url
    )
    
    service = NewsService(NewsRepository(db), AuditRepository(db))
    return service.create_news(new_post, int(current_user_id))

@router.delete(
    "/{news_id}", 
    dependencies=[Depends(require_staff)],
    summary="Remove ou desativa um comunicado",
    tags=["Notícias - Gestão"]
)
def delete_news(
    news_id: int, 
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    """
    Exclui uma notícia. 
    Aplica Soft Delete se houver histórico de leitura para preservar métricas.
    """
    current_user_id = get_current_user_id(token)
    service = NewsService(NewsRepository(db), AuditRepository(db))
    
    # Passamos a role "Administrador" ou similar se necessário para a lógica do serviço
    # Para simplificar aqui, assumimos que se passou pelo RoleChecker, tem permissão.
    result = service.delete_news(news_id, int(current_user_id), "Administrador")
    
    if not result:
        raise HTTPException(status_code=404, detail="Comunicado não encontrado.")
    
    if result == "forbidden":
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta notícia.")
    
    return {"status": "success", "message": "Notícia removida com sucesso (Log registrado)."}