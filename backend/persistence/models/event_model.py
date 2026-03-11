from sqlalchemy import Column, Integer, String, DateTime
from persistence.database import Base


class EventModel(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    location = Column(String(255))  # local como texto
    event_date = Column(DateTime, nullable=False)  # data do evento
    time = Column(String(50))
    enrollment_info = Column(String(255))