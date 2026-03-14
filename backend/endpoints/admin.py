from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from persistence.database import get_db
from persistence.repositories.audit_repository import AuditRepository
from schemas.audit_schema import AuditLogResponse
from core.security import RoleChecker

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE AUDITORIA (GOVERNANCE ROUTER)
# ==============================================================================
router = APIRouter()

# Definição de restrição de acesso: Apenas usuários com perfil "Administrador"
# Implementa a barreira de segurança RBAC para logs sensíveis.
require_admin = RoleChecker(["Administrador"])

# ==============================================================================
# ENDPOINTS DE RASTREABILIDADE (SYSTEM TRACING)
# ==============================================================================
@router.get(
    "/logs", 
    response_model=list[AuditLogResponse], 
    dependencies=[Depends(require_admin)],
    summary="Listar logs de auditoria",
    description="Recupera o histórico global de ações (Create, Update, Delete) realizadas no sistema."
)
def get_audit_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Recupera o histórico global de ações realizadas no sistema.
    
    Restrições:
        - Requer token JWT válido.
        - Exclusivo para o nível de acesso: Administrador.
    """
    # Injeção manual do repositório (Padrão Unit of Work simplificado)
    repo = AuditRepository(db)
    
    # Executa a busca paginada no banco de dados
    return repo.list_logs(skip=skip, limit=limit)