from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
from jose import jwt, JWTError
from persistence.database import get_db
from business.services.event_service import EventService
from business.services.storage_service import StorageService
from persistence.repositories.event_repository import EventRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.event_schema import EventResponse
from persistence.models.event_model import EventModel
from core.security import RoleChecker, oauth2_scheme, settings

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE EVENTOS (EVENT MANAGEMENT ROUTER)
# ==============================================================================
router = APIRouter()

# Restrição de Acesso: Apenas Staff (Admin/Colaborador) pode gerenciar
require_staff = RoleChecker(["Administrador", "Colaborador"])

def get_current_user_id(token: str) -> str:
    """Extrai de forma segura o ID do usuário do JWT para a Auditoria."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ==============================================================================
# ENDPOINTS ADMINISTRATIVOS E PÚBLICOS
# ==============================================================================
@router.post(
    "/", 
    response_model=EventResponse, 
    dependencies=[Depends(require_staff)],
    summary="Cria um novo evento com upload de banner",
    tags=["Gestão de Eventos"]
)
async def create_event(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    location: str = Form(...),
    date: str = Form(...),
    time: str = Form(...),
    enrollment_info: Optional[str] = Form(None),
    banner: UploadFile = File(...), # Recebe a imagem binária
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Registra um novo evento acadêmico.
    Fluxo: Upload do Banner -> Persistência do Modelo -> Registro de Auditoria.
    """
    current_user_id = get_current_user_id(token)
    
    # 1. PROCESSAMENTO DE MÍDIA (STORAGE)
    # Persiste o arquivo no sistema de arquivos estáticos
    storage = StorageService()
    banner_url = await storage.save_banner(banner)
    
    # 2. CONSTRUÇÃO DO MODELO DE DADOS
    event_model = EventModel(
        name=name,
        description=description,
        location=location,
        event_date=date,
        time=time,
        enrollment_info=enrollment_info,
        banner_url=banner_url
    )
    
    # 3. SERVICE LAYER (ORQUESTRAÇÃO)
    service = EventService(EventRepository(db), AuditRepository(db))
    return service.create_event(event_model, current_user_id)

@router.get(
    "/", 
    response_model=List[EventResponse],
    summary="Lista eventos com filtros dinâmicos",
    tags=["Consultas Públicas"]
)
def list_events(
    skip: int = 0, 
    limit: int = 10, 
    curso: Optional[str] = None, 
    divulgador: Optional[str] = None, 
    data_inicio: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retorna eventos disponíveis com paginação e filtros dinâmicos."""
    service = EventService(EventRepository(db), AuditRepository(db))
    return service.list_events(
        skip=skip, limit=limit, curso=curso, divulgador=divulgador, data_inicio=data_inicio
    )

@router.delete(
    "/{event_id}", 
    dependencies=[Depends(require_staff)],
    summary="Remove um evento do sistema",
    tags=["Gestão de Eventos"]
)
def delete_event(event_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """Remove o evento e gera rastro de auditoria da exclusão."""
    current_user_id = get_current_user_id(token)
    service = EventService(EventRepository(db), AuditRepository(db))
    
    deleted = service.delete_event(event_id, current_user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evento não localizado para exclusão.")
        
    return {"status": "success", "message": "Evento e mídias associadas removidos com sucesso."}