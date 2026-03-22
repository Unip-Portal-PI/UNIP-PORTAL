from persistence.repositories.news_repository import NewsRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.models.news_model import NewsModel

# ==============================================================================
# SERVIÇO DE COMUNICAÇÃO E GOVERNANÇA (EDITORIAL & NEWS SERVICE)
# ==============================================================================
class NewsService:
    """
    Serviço de Gestão de Notícias e Comunicados.
    Controla a publicação de informativos, o rastreamento de leitura
    e implementa políticas de integridade e controle de concorrência.
    """

    def __init__(self, repo: NewsRepository, audit_repo: AuditRepository):
        """
        Injeção de dependência dos repositórios de dados e logs de auditoria.
        """
        self.repo = repo
        self.audit_repo = audit_repo

    # ==========================================================================
    # PUBLICAÇÃO E ENGAJAMENTO (ENGAGEMENT ENGINE)
    # ==========================================================================
    def create_news(self, news_model: NewsModel, admin_id: int):
        """
        Publica um novo comunicado oficial no sistema.
        Vincula o autor (int) para rastreabilidade.
        """
        news_model.author_id = admin_id
        created = self.repo.create(news_model)
        
        if created:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="CREATE",
                table_name="news",
                description=f"Publicou comunicado: {created.title}"
            )
        return created

    def get_news_and_log_read(self, news_id: int, user_id: int):
        """ 
        Recupera uma notícia e registra o log de visualização.
        """
        news = self.repo.get_by_id(news_id)
        if news:
            self.repo.register_read(news_id, user_id)
        return news

    # ==========================================================================
    # ATUALIZAÇÃO E CONTROLE DE CONCORRÊNCIA (CONCURRENCY CONTROL)
    # ==========================================================================
    def update_news(self, news_id: int, news_data, user_id: int, user_role: str, version_sent: int):
        """ 
        Atualiza um comunicado validando permissões (admin/staff) e versão.
        """
        news = self.repo.get_by_id(news_id)
        if not news:
            return "not_found"

        # AJUSTE: Sincronizado com a role 'admin' (users.py)
        # Se não for admin e não for o autor, bloqueia.
        if user_role != "admin" and news.author_id != user_id:
            return "forbidden"

        # Verificação de Versão (Optimistic Concurrency Control)
        if hasattr(news, 'version') and news.version != version_sent:
            return "concurrency_error"

        updated = self.repo.update(news_id, news_data)
        if updated:
            self.audit_repo.log_action(
                user_id=str(user_id),
                action="UPDATE",
                table_name="news",
                description=f"Editou comunicado ID {news_id}"
            )
        return updated

    # ==========================================================================
    # CICLO DE VIDA E EXCLUSÃO HÍBRIDA (HYBRID DELETE LOGIC)
    # ==========================================================================
    def delete_news(self, news_id: int, user_id: int, user_role: str):
        """ 
        Executa a remoção lógica (se houver leituras) ou física baseada no engajamento.
        """
        news = self.repo.get_by_id(news_id)
        if not news:
            return None

        # AJUSTE: Sincronizado com a role 'admin'
        if user_role != "admin" and news.author_id != user_id:
            return "forbidden"

        # Inteligência de Exclusão:
        # Se houver registros de leitura, faz Soft Delete para preservar auditoria.
        has_readers = self.repo.count_reads(news_id) > 0
        
        if has_readers:
            result = self.repo.soft_delete(news_id)
            action_desc = f"Soft Delete no comunicado ID {news_id} (possuía leituras)"
        else:
            result = self.repo.physical_delete(news_id)
            action_desc = f"Delete Físico no comunicado ID {news_id} (sem leituras)"

        if result:
            self.audit_repo.log_action(
                user_id=str(user_id),
                action="DELETE",
                table_name="news",
                description=action_desc
            )
        return result

    def list_news(self, skip: int = 0, limit: int = 10, area: str | None = None):
        """Lista os comunicados ativos para o feed do sistema."""
        return self.repo.list(skip=skip, limit=limit, area=area)