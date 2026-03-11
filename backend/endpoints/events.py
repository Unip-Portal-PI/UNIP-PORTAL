from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from persistence.database import get_db
from business.services.event_service import EventService
from persistence.repositories.event_repository import EventRepository
from schemas.event_schema import EventCreate, EventResponse
from persistence.models.event_model import EventModel

router = APIRouter()

@router.post("/", response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    event_model = EventModel(
        name=event.name,
        description=event.description,
        location=event.location,
        event_date=event.date,
        time=event.time,
        enrollment_info=event.enrollment_info
    )
    db.add(event_model)
    db.commit()
    db.refresh(event_model)
    return event_model

@router.get("/", response_model=list[EventResponse])
def list_events(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    service = EventService(EventRepository(db))
    return service.list_events(skip=skip, limit=limit)

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    service = EventService(EventRepository(db))
    event = service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event: EventCreate, db: Session = Depends(get_db)):
    service = EventService(EventRepository(db))
    updated_event = service.update_event(event_id, event)
    if not updated_event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return updated_event

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    service = EventService(EventRepository(db))
    deleted = service.delete_event(event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return {"message": "Evento removido com sucesso"}