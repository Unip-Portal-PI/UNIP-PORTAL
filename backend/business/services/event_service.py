from persistence.repositories.event_repository import EventRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.models.event_model import EventModel
from typing import Optional, List, Dict, Any, Union
from datetime import date

# ==============================================================================
# SERVIÇO DE GESTÃO DE EVENTOS
# ==============================================================================
class EventService:
    """
    Serviço especializado para a gestão de eventos acadêmicos.
    Centraliza a criação, filtragem, atualizações e gestão do ciclo de vida,
    garantindo a integridade dos dados e trilhas de auditoria obrigatórias.
    """

    def __init__(self, repo: EventRepository, audit_repo: AuditRepository):
        self.repo = repo
        self.audit_repo = audit_repo

    # ==========================================================================
    # 1. OPERAÇÕES DE LEITURA
    # ==========================================================================

    def list_events(self, 
                    skip: int = 0, 
                    limit: int = 20, 
                    area: Optional[str] = None, 
                    shift: Optional[str] = None, 
                    include_expired: bool = False) -> List[EventModel]:
        """
        Retorna uma lista de eventos filtrados.
        """
        return self.repo.list(
            skip=skip, 
            limit=limit, 
            area=area, 
            shift=shift, 
            include_expired=include_expired
        )

    def get_event(self, event_id: int) -> Optional[EventModel]:
        """
        Busca os detalhes completos de um evento pelo ID.
        """
        return self.repo.get_by_id(event_id)

    # ==========================================================================
    # 2. OPERAÇÕES DE ESCRITA
    # ==========================================================================
    
    def create_event(self, event_data: Dict[str, Any], admin_id: int) -> EventModel:
        """
        Registra um novo evento validando regras de data e tipos de inscrição.
        """
        # 1. Validação de Data: Evita eventos retroativos
        event_date_val = event_data.get('event_date')
        
        if isinstance(event_date_val, str):
            event_date_val = date.fromisoformat(event_date_val)
            
        if event_date_val and event_date_val < date.today():
            raise ValueError("A data do evento não pode ser no passado.")

        # 2. Validação de Inscrição Externa: URL é obrigatória se o tipo for 'external'
        reg_type = event_data.get('registration_type', 'internal')
        ext_url = event_data.get('external_url')

        if reg_type == "external" and (not ext_url or ext_url.strip() == ""):
            raise ValueError("Para eventos com inscrição externa, uma URL de destino é obrigatória.")

        # 3. Persistência via Repositório
        created = self.repo.create(event_data, owner_id=admin_id)
        
        # 4. Log de Auditoria
        if created:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="CREATE",
                table_name="events",
                description=(
                    f"Evento criado: {created.title} (Vagas: {created.total_slots}) | "
                    f"Local: {created.location} | Área: {created.area}"
                )
            )
        return created

    def update_event(self, event_id: int, event_data: Union[Dict[str, Any], Any], admin_id: int) -> Optional[EventModel]:
        """
        Atualiza um evento existente e registra a alteração.
        """
        # Validação de lógica de negócio na atualização
        if isinstance(event_data, dict):
            reg_type = event_data.get('registration_type')
            ext_url = event_data.get('external_url')
            
            if reg_type == "external" and (not ext_url or ext_url.strip() == ""):
                raise ValueError("Não é possível alterar para inscrição externa sem fornecer uma URL.")

        updated = self.repo.update(event_id, event_data)
        
        if updated:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="UPDATE",
                table_name="events",
                description=f"Evento ID {event_id} atualizado: {updated.title}"
            )
        return updated

    def delete_event(self, event_id: int, admin_id: int) -> bool:
        """
        Remove ou desativa um evento e registra o usuário responsável.
        """
        result = self.repo.delete(event_id)
        
        if result:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="DELETE",
                table_name="events",
                description=f"Exclusão/Desativação executada para o evento ID: {event_id}"
            )
        return result

    # ==========================================================================
    # 3. MÉTODOS AUXILIARES (HELPERS)
    # ==========================================================================

    def check_availability(self, event_id: int) -> Dict[str, Any]:
        """
        Verifica se um evento ainda aceita inscrições internas.
        """
        event = self.get_event(event_id)
        
        if not event:
            return {"available": False, "reason": "Evento não encontrado."}
        
        if event.registration_type == "external":
            return {
                "available": True, 
                "external": True, 
                "url": event.external_url,
                "reason": "Inscrição gerenciada externamente."
            }

        if not event.is_active:
            return {"available": False, "reason": "Evento cancelado ou inativo."}
        
        # Utiliza propriedades do EventModel (Propriedades Lógicas)
        if getattr(event, 'is_registration_closed', False):
            return {"available": False, "reason": "O prazo de inscrição encerrou."}
            
        if not getattr(event, 'has_vacancies', True):
            return {"available": False, "reason": "Não há vagas disponíveis."}

        slots_left = event.total_slots - (event.occupied_slots or 0)
        return {"available": True, "slots_left": slots_left}