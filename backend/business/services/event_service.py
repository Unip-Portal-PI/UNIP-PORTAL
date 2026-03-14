from persistence.repositories.event_repository import EventRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.models.event_model import EventModel
from datetime import datetime
from typing import Optional

# ==============================================================================
# SERVIÇO DE GESTÃO DE EVENTOS (EVENT MANAGEMENT SERVICE)
# ==============================================================================
class EventService:
    """
    Serviço especializado na gestão de eventos acadêmicos e simpósios.
    Centraliza a criação, filtragem e ciclo de vida dos eventos, 
    garantindo que todas as alterações sejam registradas na auditoria.
    """

    def __init__(self, repo: EventRepository, audit_repo: AuditRepository):
        """
        Injeção de dependência: Acopla o repositório de dados e o motor de auditoria.
        """
        self.repo = repo
        self.audit_repo = audit_repo

    # ==========================================================================
    # CRIAÇÃO E PERSISTÊNCIA (WRITE OPERATIONS)
    # ==========================================================================
    def create_event(self, event: EventModel, admin_id: str):
        """
        Registra um novo evento no sistema e gera log de auditoria compulsório.
        
        Args:
            event (EventModel): Instância do modelo com os dados do evento.
            admin_id (str): Identificador do administrador que realizou a ação.
        """
        created = self.repo.create(event)
        
        if created:
            self.audit_repo.log_action(
                user_id=admin_id,
                action="CREATE",
                table_name="events",
                description=f"Criou o evento: {created.name}"
            )
        return created

    # ==========================================================================
    # CONSULTAS E FILTRAGEM (READ OPERATIONS)
    # ==========================================================================
    def list_events(self, 
                    skip: int = 0, 
                    limit: int = 10, 
                    curso: Optional[str] = None, 
                    divulgador: Optional[str] = None, 
                    data_inicio: Optional[str] = None):
        """
        Lista eventos com suporte a paginação e filtros dinâmicos.
        Realiza o tratamento de strings ISO para objetos nativos Python (Safety First).
        """
        
        # 1. TRATAMENTO DE DATA (PREVENTIVE VALIDATION)
        # Converte a string da API para datetime para garantir compatibilidade com o ORM
        dt_obj = None
        if data_inicio:
            try:
                dt_obj = datetime.fromisoformat(data_inicio)
            except ValueError:
                # Silencia o erro de formato inválido anulando o filtro (Graceful Degradation)
                dt_obj = None

        return self.repo.list(
            skip=skip, 
            limit=limit, 
            curso=curso, 
            divulgador=divulgador, 
            data_inicio=dt_obj
        )

    def get_event(self, event_id: int):
        """Recupera os detalhes completos de um evento pelo seu ID primário."""
        return self.repo.get_by_id(event_id)

    # ==========================================================================
    # ATUALIZAÇÃO E CICLO DE VIDA (MAINTENANCE)
    # ==========================================================================
    def update_event(self, event_id: int, event_data, admin_id: str):
        """
        Atualiza dados de um evento existente e gera rastro de auditoria.
        """
        updated = self.repo.update(event_id, event_data)
        
        if updated:
            self.audit_repo.log_action(
                user_id=admin_id,
                action="UPDATE",
                table_name="events",
                description=f"Atualizou o evento ID: {event_id}"
            )
        return updated

    def delete_event(self, event_id: int, admin_id: str):
        """
        Remove o evento da base e registra quem foi o responsável pela exclusão.
        """
        result = self.repo.delete(event_id)
        
        if result:
            self.audit_repo.log_action(
                user_id=admin_id,
                action="DELETE",
                table_name="events",
                description=f"Removeu o evento ID: {event_id}"
            )
        return result