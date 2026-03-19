from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from persistence.database import get_db
from business.services.event_service import EventService
from business.services.storage_service import StorageService
from persistence.repositories.event_repository import EventRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.event_schema import EventResponse
from core.security import RoleChecker

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE EVENTOS
# ==============================================================================
router = APIRouter(prefix="", tags=["Eventos Acadêmicos"])

# Permissões: Apenas admin e staff podem realizar operações de escrita (POST, PUT, DELETE)
require_staff = RoleChecker(["admin", "staff"])

@router.post(
    "/", 
    # Usamos EventResponse para garantir que a saída siga o contrato, 
    # mesmo que a entrada seja via Form-Data
    response_model=EventResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Criar um novo evento com banner (Multipart Form-Data)",
)
async def create_event(
    # Cada campo deve ser Explicitamente Form para evitar o erro 422 "body required"
    # O Pydantic validará os tipos (date, int, str) após a extração do formulário
    title: str = Form(..., description="Título do evento"),
    short_description: Optional[str] = Form(None, description="Resumo para listagem"),
    full_description: Optional[str] = Form(None, description="Descrição completa"),
    area: str = Form("Geral", description="Área acadêmica"),
    event_date: date = Form(..., description="Data do evento (YYYY-MM-DD)"), 
    start_time: str = Form(..., description="Hora de início (HH:mm)"), 
    shift: str = Form(..., description="Turno: Manhã, Tarde ou Noite"), 
    location: str = Form(..., description="Local físico ou link"),
    deadline_date: date = Form(..., description="Data limite para inscrição"),
    total_slots: int = Form(..., description="Total de vagas"),
    registration_type: str = Form("interna", description="Tipo: interna ou externa"),
    external_url: Optional[str] = Form(None, description="Link externo se aplicável"),
    visibility: str = Form("publica", description="Visibilidade: publica ou privada"),
    # O arquivo deve ser enviado na chave 'banner' no Form-Data
    banner: UploadFile = File(..., description="Imagem de destaque do evento"),
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    """
    Registra um novo evento acadêmico. 
    Recebe dados via Multipart Form-Data para suportar o upload de imagem.
    """
    
    # 1. PROCESSAMENTO DO BANNER (Upload para storage ou local)
    storage = StorageService()
    banner_url = await storage.save_banner(banner)
    
    # 2. PREPARAÇÃO DOS DADOS
    # Montamos o dicionário para que o Service/Repository processe de forma padronizada
    event_dict = {
        "title": title,
        "short_description": short_description,
        "full_description": full_description,
        "area": area,
        "event_date": event_date,
        "start_time": start_time,
        "shift": shift,
        "location": location,
        "deadline_date": deadline_date,
        "total_slots": total_slots,
        "registration_type": registration_type,
        "external_url": external_url,
        "visibility": visibility,
        "banner_url": banner_url
    }
    
    # 3. EXECUÇÃO VIA SERVICE
    # Injeta os repositórios necessários no serviço de eventos
    service = EventService(EventRepository(db), AuditRepository(db))
    return service.create_event(event_dict, current_user.id)


@router.put(
    "/{event_id}", 
    response_model=EventResponse, 
    summary="Atualizar um evento existente",
)
async def update_event(
    event_id: int,
    title: Optional[str] = Form(None),
    short_description: Optional[str] = Form(None),
    area: Optional[str] = Form(None),
    event_date: Optional[date] = Form(None),
    start_time: Optional[str] = Form(None),
    shift: Optional[str] = Form(None),
    total_slots: Optional[int] = Form(None),
    banner: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_staff)
):
    """
    Atualiza dados do evento via Form-Data. Campos não enviados não serão alterados.
    """
    service = EventService(EventRepository(db), AuditRepository(db))
    
    # Mapeamento dinâmico: apenas chaves preenchidas entram no dicionário de update
    update_data = {}
    if title: update_data["title"] = title
    if short_description: update_data["short_description"] = short_description
    if area: update_data["area"] = area
    if event_date: update_data["event_date"] = event_date
    if start_time: update_data["start_time"] = start_time
    if shift: update_data["shift"] = shift
    if total_slots is not None: update_data["total_slots"] = total_slots

    if banner:
        storage = StorageService()
        update_data["banner_url"] = await storage.save_banner(banner)

    updated = service.update_event(event_id, update_data, current_user.id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Evento não encontrado ou sem permissão para editar."
        )
        
    return updated


@router.get(
    "/", 
    response_model=List[EventResponse],
    summary="Listar eventos com filtros",
)
def list_events(
    skip: int = 0, 
    limit: int = 20, 
    area: Optional[str] = None,
    shift: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retorna uma lista de eventos ativos com suporte a paginação e filtros por área/turno."""
    service = EventService(EventRepository(db), AuditRepository(db))
    return service.list_events(skip=skip, limit=limit, area=area, shift=shift)


@router.get(
    "/{event_id}", 
    response_model=EventResponse,
    summary="Obter detalhes de um evento específico",
)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Busca os detalhes completos de um evento pelo seu ID único."""
    service = EventService(EventRepository(db), AuditRepository(db))
    event = service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado.")
    return event


@router.delete(
    "/{event_id}", 
    summary="Remover ou desativar um evento",
)
def delete_event(
    event_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(require_staff)
):
    """
    Remove fisicamente se não houver inscritos ou 
    realiza desativação lógica (soft delete) se houver histórico.
    """
    service = EventService(EventRepository(db), AuditRepository(db))
    if not service.delete_event(event_id, current_user.id):
        raise HTTPException(status_code=404, detail="Evento não encontrado.")
        
    return {"status": "success", "message": "Evento removido/desativado com sucesso."}