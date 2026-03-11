from sqlalchemy.orm import Session
from persistence.models.event_model import EventModel

class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, skip: int = 0, limit: int = 10):
        return self.db.query(EventModel).offset(skip).limit(limit).all()

    def create(self, event: EventModel):
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event


    def get_by_id(self, event_id: int):
        return self.db.query(EventModel).filter(EventModel.id == event_id).first()

    def update(self, event_id: int, event_data):
        event = self.get_by_id(event_id)
        if not event:
            return None
        for key, value in event_data.dict().items():
            setattr(event, key if key != "date" else "event_date", value)
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete(self, event_id: int):
        event = self.get_by_id(event_id)
        if not event:
            return None
        self.db.delete(event)
        self.db.commit()
        return True