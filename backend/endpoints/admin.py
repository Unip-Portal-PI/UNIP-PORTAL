from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from persistence.database import get_db
from business.services.auth_service import AuthService
from persistence.repositories.audit_repository import AuditRepository
from persistence.repositories.user_repository import UserRepository
from schemas.audit_schema import AuditLogResponse
from schemas.user_schema import UserResponse
from core.security import RoleChecker, oauth2_scheme

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE ALTA PRIVILÉGIO (GOVERNANCE ROUTER)
# ==============================================================================
router = APIRouter()

# AJUSTE CRÍTICO: Sincronizado com o padrão "admin" do banco de dados
require_admin = RoleChecker(["admin"])

# ==============================================================================
# AUDITORIA E RASTREABILIDADE
# ==============================================================================

@router.get(
    "/logs", 
    response_model=List[AuditLogResponse], 
    dependencies=[Depends(require_admin)],
    summary="Listar trilha de auditoria global",
    tags=["Governança"]
)
def get_audit_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Exibe todas as ações críticas do sistema (quem criou/editou/deletou o quê).
    Acesso restrito ao perfil 'admin'.
    """
    repo = AuditRepository(db)
    return repo.list_logs(skip=skip, limit=limit)

# ==============================================================================
# GESTÃO AVANÇADA DE USUÁRIOS (IAM)
# ==============================================================================

@router.get(
    "/users", 
    response_model=List[UserResponse], 
    dependencies=[Depends(require_admin)],
    summary="Listagem detalhada de usuários",
    tags=["Governança"]
)
def list_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retorna a lista de todos os usuários cadastrados para gestão administrativa."""
    repo = UserRepository(db)
    return repo.list(skip=skip, limit=limit)

@router.delete(
    "/users/{user_id}", 
    dependencies=[Depends(require_admin)],
    summary="Desativar usuário do sistema",
    tags=["Governança"]
)
def administrative_delete(user_id: int, db: Session = Depends(get_db)):
    """Remove um usuário (Soft Delete) por ordem administrativa."""
    repo = UserRepository(db)
    success = repo.delete(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"status": "success", "message": f"Usuário {user_id} desativado."}