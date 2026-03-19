from persistence.repositories.internship_repository import InternshipRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.models.internship_model import InternshipModel
from typing import Optional

# ==============================================================================
# SERVIÇO DE OPORTUNIDADES DE CARREIRA (CAREER & INTERNSHIP SERVICE)
# ==============================================================================
class InternshipService:
    """
    Serviço de Gestão de Oportunidades de Carreira (Estágios).
    Gerencia o ciclo de vida das vagas, permitindo que administradores publiquem, 
    editem e removam ofertas, mantendo um log detalhado de cada ação.
    """

    def __init__(self, repo: InternshipRepository, audit_repo: AuditRepository):
        """
        Injeção de dependência dos repositórios de dados e rastreabilidade.
        """
        self.repo = repo
        self.audit_repo = audit_repo

    # ==========================================================================
    # CRIAÇÃO E PUBLICAÇÃO (POSTING ENGINE)
    # ==========================================================================
    def create_internship(self, internship: InternshipModel, admin_id: int): # AJUSTE: int
        """
        Publica uma nova vaga de estágio e registra a autoria.
        
        Args:
            internship (InternshipModel): Instância com dados da empresa, cargo e requisitos.
            admin_id (int): ID do administrador responsável pela postagem.
        """
        created = self.repo.create(internship)
        
        if created:
            self.audit_repo.log_action(
                user_id=str(admin_id), # Garante conversão para string no log se necessário
                action="CREATE",
                table_name="internships",
                description=f"Postou vaga de {created.position} na empresa {created.company}"
            )
        return created

    # ==========================================================================
    # CONSULTAS E BUSCA DINÂMICA (FEED ENGINE)
    # ==========================================================================
    def list_internships(self, skip: int = 0, limit: int = 10, search: Optional[str] = None):
        """
        Lista as vagas disponíveis com suporte a paginação e busca por texto.
        Otimizado para o feed principal do dashboard do aluno.
        """
        return self.repo.list(skip=skip, limit=limit, search=search)

    def get_internship(self, internship_id: int):
        """Busca os detalhes completos de uma vaga específica via ID."""
        return self.repo.get_by_id(internship_id)

    # ==========================================================================
    # MANUTENÇÃO E CICLO DE VIDA (LIFE CYCLE)
    # ==========================================================================
    def update_internship(self, internship_id: int, internship_data, admin_id: int): # AJUSTE: int
        """
        Atualiza as informações de uma vaga e audita a alteração.
        Útil para correções de prazos ou alteração de requisitos.
        """
        updated = self.repo.update(internship_id, internship_data)
        
        if updated:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="UPDATE",
                table_name="internships",
                description=f"Atualizou vaga de estágio ID: {internship_id}"
            )
        return updated

    def delete_internship(self, internship_id: int, admin_id: int): # AJUSTE: int
        """
        Remove uma vaga do sistema de forma lógica (Soft Delete).
        Garante que os logs de auditoria continuem apontando para um ID válido.
        """
        result = self.repo.delete(internship_id)
        
        if result:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="DELETE",
                table_name="internships",
                description=f"Desativou (Soft Delete) vaga de estágio ID: {internship_id}"
            )
        return result