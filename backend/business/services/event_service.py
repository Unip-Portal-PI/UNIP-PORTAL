from persistence.repositories.event_repository import EventRepository
from persistence.models.event_model import EventModel

class EventService:
    def __init__(self, repo: EventRepository):
        self.repo = repo

    def create_event(self, event: EventModel):
        return self.repo.create(event)

    def list_events(self, skip: int = 0, limit: int = 10):
        return self.repo.list(skip=skip, limit=limit)

    def get_event(self, event_id: int):
        return self.repo.get_by_id(event_id)

    def update_event(self, event_id: int, event_data):
        return self.repo.update(event_id, event_data)

    def delete_event(self, event_id: int):
        return self.repo.delete(event_id)