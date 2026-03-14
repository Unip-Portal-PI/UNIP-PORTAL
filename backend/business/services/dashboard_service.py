from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.repositories.news_repository import NewsRepository
from persistence.repositories.internship_repository import InternshipRepository

# ==============================================================================
# SERVIÇO AGREGADOR DE DASHBOARD (FACADE LAYER)
# ==============================================================================
class DashboardService:
    """
    Serviço Agregador especializado no Dashboard do Aluno.
    Consolida múltiplas fontes de dados (Inscrições, Notícias e Estágios) em um 
    único objeto para otimizar o carregamento da interface.
    """

    def __init__(self, 
                 enrollment_repo: EnrollmentRepository, 
                 news_repo: NewsRepository,
                 internship_repo: InternshipRepository):
        """
        Injeção de dependência dos repositórios necessários para compor a visão
        geral do ecossistema do aluno.
        """
        self.enroll_repo = enrollment_repo
        self.news_repo = news_repo
        self.intern_repo = internship_repo

    # ==========================================================================
    # CONSOLIDAÇÃO DE DADOS (READ-ONLY OPERATIONS)
    # ==========================================================================
    def get_student_summary(self, user_id: int):
        """
        Gera um resumo completo do ecossistema do aluno.
        
        Args:
            user_id: ID do aluno autenticado extraído do Token JWT.
            
        Returns:
            dict: Objeto contendo listas de inscrições, notícias e vagas de estágio.
        """
        
        # ======================================================================
        # 1. RECUPERAÇÃO DE INSCRIÇÕES 
        # ======================================================================
        # Busca o histórico e eventos atuais do aluno (utiliza joinedload internamente)
        enrollments = self.enroll_repo.list_by_user(user_id)
        
        # ======================================================================
        # 2. CONTEÚDO INFORMATIVO (EDITORIAL)
        # ======================================================================
        # Busca as 3 notícias mais recentes publicadas no sistema
        news = self.news_repo.list(skip=0, limit=3)
        
        # ======================================================================
        # 3. OPORTUNIDADES DE CARREIRA (MARKET)
        # ======================================================================
        # Seleciona as 3 últimas vagas de estágio cadastradas e ativas
        internships = self.intern_repo.list(skip=0, limit=3)
        
        # ======================================================================
        # 4. ESTRUTURA DE RETORNO (AGGREGATED RESPONSE)
        # ======================================================================
        # Este dicionário será automaticamente mapeado pelo StudentDashboardResponse (Schema)
        return {
            "my_enrollments": enrollments,
            "latest_news": news,
            "recent_internships": internships
        }