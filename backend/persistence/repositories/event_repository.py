from sqlalchemy.orm import Session
from persistence.models.event_model import EventModel
from typing import Optional, List
from datetime import datetime

# ==============================================================================
# REPOSITÓRIO DE EVENTOS (EVENT LOGISTICS LAYER)
# ==============================================================================
class EventRepository:
    """
    Gerencia o ciclo de vida dos eventos acadêmicos.
    Implementa filtros dinâmicos e lógica de visibilidade temporal.
    """

    def __init__(self, db: Session):
        """Injeta a sessão do banco de dados para operações de persistência."""
        self.db = db

    # ==========================================================================
    # CONSULTA E FILTRAGEM DINÂMICA
    # ==========================================================================
    def list(self, 
             skip: int = 0, 
             limit: int = 10, 
             curso: Optional[str] = None, 
             divulgador: Optional[str] = None,
             data_inicio: Optional[datetime] = None) -> List[EventModel]:
        """
        Retorna lista de eventos com filtros parciais e cronológicos.
        Ordena automaticamente pelos eventos mais próximos.
        """
        query = self.db.query(EventModel)

        # Filtro por curso (busca dentro das informações de inscrição)
        if curso:
            query = query.filter(EventModel.enrollment_info.ilike(f"%{curso}%"))
        
        # Filtro por local ou responsável
        if divulgador:
            query = query.filter(EventModel.location.ilike(f"%{divulgador}%"))

        # Filtro de Período (Eventos a partir de hoje/data informada)
        if data_inicio:
            query = query.filter(EventModel.event_date >= data_inicio)

        # Ordenação Cronológica: O mais próximo primeiro
        return query.order_by(EventModel.event_date.asc()).offset(skip).limit(limit).all()

    # ==========================================================================
    # OPERAÇÕES DE PERSISTÊNCIA (CRUD)
    # ==========================================================================
    def create(self, event: EventModel) -> EventModel:
        """Salva um novo evento no banco de dados."""
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_by_id(self, event_id: int) -> Optional[EventModel]:
        """Localiza um evento pelo seu identificador único."""
        return self.db.query(EventModel).filter(EventModel.id == event_id).first()

    def update(self, event_id: int, event_data) -> Optional[EventModel]:
        """
        Executa atualização parcial (PATCH style).
        Resolve o mapeamento entre 'date' (frontend) e 'event_date' (backend).
        """
        event = self.get_by_id(event_id)
        if not event:
            return None
        
        update_data = event_data.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            # Mapeamento de compatibilidade
            field = key if key != "date" else "event_date"
            if hasattr(event, field):
                setattr(event, field, value)
        
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete(self, event_id: int) -> bool:
        """Remove permanentemente um evento do banco de dados."""
        event = self.get_by_id(event_id)
        if not event:
            return False
        self.db.delete(event)
        self.db.commit()
        return True