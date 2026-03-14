from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from persistence.database import get_db
from core.security import oauth2_scheme, settings

from business.services.dashboard_service import DashboardService
from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.repositories.news_repository import NewsRepository
from persistence.repositories.internship_repository import InternshipRepository
from schemas.dashboard_schema import StudentDashboardResponse

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE DASHBOARD (AGGREGATION LAYER)
# ==============================================================================
router = APIRouter()

# ==============================================================================
# UTILITÁRIOS DE IDENTIDADE (JWT DECODER)
# ==============================================================================
def get_current_user_id(token: str) -> int:
    """
    Decodifica o token de acesso para recuperar o ID do aluno.
    Garante que o acesso seja negado caso o token esteja malformado.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="ID de usuário não encontrado no token.")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Token de autenticação inválido ou expirado.")

# ==============================================================================
# ENDPOINTS DE RESUMO (PERSONALIZED VIEW)
# ==============================================================================
@router.get(
    "/dashboard", 
    response_model=StudentDashboardResponse,
    summary="Obtém visão consolidada do aluno",
    tags=["Dashboard"]
)
def get_dashboard(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """
    Retorna o resumo personalizado para o aluno logado.
    
    Agrega dados de:
    - **Inscrições**: Próximos eventos que o aluno deve comparecer.
    - **Notícias**: Comunicados institucionais recentes.
    - **Carreiras**: Últimas vagas de estágio publicadas.
    """
    
    # 1. Resgate da identidade do aluno através do Token
    user_id = get_current_user_id(token)
    
    # 2. Injeção de dependências (Orquestração de Repositórios)
    # O DashboardService é um agregador que não altera dados, apenas os organiza.
    service = DashboardService(
        enrollment_repo=EnrollmentRepository(db),
        news_repo=NewsRepository(db),
        internship_repo=InternshipRepository(db)
    )
    
    # 3. Execução da busca consolidada
    # Retorna o Schema StudentDashboardResponse pronto para o consumo do Frontend
    return service.get_student_summary(user_id)