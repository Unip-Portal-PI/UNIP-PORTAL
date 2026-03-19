from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from jose import jwt, JWTError
from persistence.database import get_db
from business.services.internship_service import InternshipService
from persistence.repositories.internship_repository import InternshipRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.internship_schema import InternshipCreate, InternshipResponse
from persistence.models.internship_model import InternshipModel
from core.security import RoleChecker, oauth2_scheme, settings

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR E CONTROLE DE ACESSO (CAREER ROUTER)
# ==============================================================================
router = APIRouter()

# AJUSTE: Roles sincronizadas com o padrão do banco (admin, staff)
require_staff = RoleChecker(["admin", "staff"])

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """Extrai de forma segura o ID do usuário (sub) para Auditoria."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")

# ==============================================================================
# OPERAÇÕES DE ESCRITA (ADMINISTRATIVO)
# ==============================================================================
@router.post(
    "/", 
    response_model=InternshipResponse, 
    dependencies=[Depends(require_staff)],
    summary="Publica uma nova vaga de estágio",
    tags=["Estágios"]
)
def create_internship(
    internship: InternshipCreate, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Registra uma nova vaga no mural e gera rastro de auditoria."""
    internship_model = InternshipModel(
        company=internship.company,
        position=internship.position,
        description=internship.description,
        location=internship.location,
        start_date=internship.start_date,
        end_date=internship.end_date
    )
    
    service = InternshipService(InternshipRepository(db), AuditRepository(db))
    created = service.create_internship(internship_model, current_user_id)
    
    if not created:
        raise HTTPException(status_code=400, detail="Não foi possível publicar a vaga.")
    return created

@router.put(
    "/{internship_id}", 
    response_model=InternshipResponse, 
    dependencies=[Depends(require_staff)],
    summary="Atualiza dados de uma vaga",
    tags=["Estágios"]
)
def update_internship(
    internship_id: int, 
    internship: InternshipCreate, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Atualiza requisitos ou datas de uma vaga existente."""
    service = InternshipService(InternshipRepository(db), AuditRepository(db))
    
    updated = service.update_internship(internship_id, internship, current_user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Vaga não localizada para atualização.")
    return updated

@router.delete(
    "/{internship_id}", 
    dependencies=[Depends(require_staff)],
    summary="Remove/Desativa uma vaga",
    tags=["Estágios"]
)
def delete_internship(
    internship_id: int, 
    db: Session = Depends(get_db), 
    current_user_id: int = Depends(get_current_user_id)
):
    """Executa Soft Delete e registra a responsabilidade da exclusão."""
    service = InternshipService(InternshipRepository(db), AuditRepository(db))
    
    deleted = service.delete_internship(internship_id, current_user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Vaga não localizada para remoção.")
        
    return {"status": "success", "message": "Vaga desativada com sucesso."}

# ==============================================================================
# OPERAÇÕES DE LEITURA (PÚBLICO/ALUNO)
# ==============================================================================
@router.get(
    "/", 
    response_model=List[InternshipResponse],
    summary="Lista vagas com busca opcional",
    tags=["Estágios"]
)
def list_internships(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Feed de estágios com suporte a busca textual e paginação."""
    service = InternshipService(InternshipRepository(db), AuditRepository(db))
    return service.list_internships(skip=skip, limit=limit, search=search)

@router.get(
    "/{internship_id}", 
    response_model=InternshipResponse,
    summary="Busca detalhes de uma vaga específica",
    tags=["Estágios"]
)
def get_internship(internship_id: int, db: Session = Depends(get_db)):
    """Detalhes completos de uma vaga para visualização do aluno."""
    service = InternshipService(InternshipRepository(db), AuditRepository(db))
    internship = service.get_internship(internship_id)
    
    if not internship:
        raise HTTPException(status_code=404, detail="Oportunidade não encontrada.")
    return internship