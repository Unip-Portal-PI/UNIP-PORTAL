from pydantic import BaseModel
from typing import List
from schemas.enrollment_schema import EnrollmentResponse
from schemas.news_schema import NewsResponse
from schemas.internship_schema import InternshipResponse

# ==============================================================================
# SCHEMA DE COMPOSIÇÃO DO DASHBOARD (DATA AGGREGATION)
# ==============================================================================
class StudentDashboardResponse(BaseModel):
    """
    Schema consolidado para o Dashboard do Aluno.
    Reúne inscrições, notícias e vagas de estágio em um único objeto de resposta,
    otimizando a comunicação entre o Frontend e o Backend.
    """

    # Lista de inscrições ativas do aluno logado
    my_enrollments: List[EnrollmentResponse]
    
    # Mural das últimas notícias oficiais publicadas
    latest_news: List[NewsResponse]
    
    # Bloco de oportunidades de estágio recentes
    recent_internships: List[InternshipResponse]

    # ==========================================================================
    # CONFIGURAÇÃO DE COMPATIBILIDADE
    # ==========================================================================
    class Config:
        """
        Garante que o Pydantic consiga converter a união de múltiplos 
        objetos do banco (SQLAlchemy) nesta estrutura composta.
        """
        from_attributes = True