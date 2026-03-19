from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from persistence.models.event_model import EventModel, AttachmentModel
from persistence.models.enrollment_model import EnrollmentModel
from typing import Optional, List, Any, Dict, Union
from datetime import datetime, date

class EventRepository:
    """
    Gerencia o ciclo de vida dos eventos no banco de dados.
    Suporta recuperação de anexos, controle de vagas e filtragem por área/turno.
    """

    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # 1. OPERAÇÕES DE LEITURA
    # ==========================================================================

    def list(self, 
             skip: int = 0, 
             limit: int = 20, 
             area: Optional[str] = None, 
             shift: Optional[str] = None,
             include_expired: bool = False) -> List[EventModel]:
        """
        Lista eventos ativos com carregamento antecipado (eager loading) de anexos.
        """
        # joinedload evita o problema de consulta N+1
        query = self.db.query(EventModel).options(joinedload(EventModel.attachments))

        # Filtros dinâmicos (usando nomes em inglês conforme definido no EventModel)
        if area and area != "All":
            query = query.filter(EventModel.area == area)
        
        if shift:
            query = query.filter(EventModel.shift == shift)

        # Filtro de expiração e atividade
        if not include_expired:
            today = date.today()
            query = query.filter(
                EventModel.is_active == True,
                EventModel.event_date >= today
            )

        return query.order_by(EventModel.event_date.asc(), EventModel.start_time.asc())\
                    .offset(skip).limit(limit).all()

    def get_by_id(self, event_id: int) -> Optional[EventModel]:
        """Busca um evento específico incluindo seus anexos."""
        return self.db.query(EventModel)\
            .options(joinedload(EventModel.attachments))\
            .filter(EventModel.id == event_id).first()

    # ==========================================================================
    # 2. OPERAÇÕES DE ESCRITA
    # ==========================================================================

    def create(self, event_data: Dict[str, Any], owner_id: int) -> EventModel:
        """
        Cria um evento e seus respectivos anexos em uma única transação.
        """
        # Extrai os dados dos anexos (procurando apenas por 'attachments')
        attachments_data = event_data.pop('attachments', [])
        
        # Cria a instância do evento
        new_event = EventModel(**event_data, owner_id=owner_id)
        
        # Adiciona anexos ao relacionamento
        for att in attachments_data:
            # Se att for um objeto Pydantic (AttachmentCreate), converte para dicionário
            att_dict = att.model_dump() if hasattr(att, "model_dump") else att
            new_event.attachments.append(AttachmentModel(**att_dict))

        self.db.add(new_event)
        try:
            self.db.commit()
            self.db.refresh(new_event)
            return new_event
        except Exception as e:
            self.db.rollback()
            raise e

    def update(self, event_id: int, event_data: Union[Dict[str, Any], Any]) -> Optional[EventModel]:
        """
        Atualiza os campos de um evento.
        """
        event = self.get_by_id(event_id)
        if not event:
            return None
        
        # Converte os dados para um dicionário limpo
        if hasattr(event_data, "model_dump"):
            update_data = event_data.model_dump(exclude_unset=True)
        elif isinstance(event_data, dict):
            update_data = event_data.copy()
        else:
            update_data = vars(event_data)

        # Remove chaves que não devem ser atualizadas em massa aqui
        update_data.pop('attachments', None)
        update_data.pop('id', None)

        for key, value in update_data.items():
            if hasattr(event, key):
                # Garante que campos de data sejam objetos date
                if key in ["event_date", "deadline_date"] and isinstance(value, str):
                    value = date.fromisoformat(value)
                setattr(event, key, value)
        
        try:
            self.db.commit()
            self.db.refresh(event)
            return event
        except Exception as e:
            self.db.rollback()
            raise e

    # ==========================================================================
    # 3. UTILITÁRIOS E EXCLUSÃO
    # ==========================================================================

    def increment_occupancy(self, event_id: int) -> bool:
        """Incrementa o contador de vagas ocupadas."""
        event = self.get_by_id(event_id)
        if event and event.occupied_slots < event.total_slots:
            event.occupied_slots += 1
            self.db.commit()
            return True
        return False

    def delete(self, event_id: int) -> bool:
        """
        Exclusão física se não houver inscritos, caso contrário, desativação (Soft Delete).
        """
        event = self.get_by_id(event_id)
        if not event:
            return False

        # Conta as inscrições usando EnrollmentModel
        enrollment_count = self.db.query(func.count(EnrollmentModel.id))\
            .filter(EnrollmentModel.event_id == event_id).scalar()

        try:
            if enrollment_count == 0:
                # O cascade="all, delete-orphan" no Modelo gerencia a exclusão de AttachmentModel
                self.db.delete(event) 
            else:
                # Mantém o registro mas o esconde da listagem principal
                event.is_active = False 
            
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            raise e