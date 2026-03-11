from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: str
    date: datetime
    time: str
    enrollment_info: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    location: str
    event_date: datetime
    time: str
    enrollment_info: Optional[str] = None

    class Config:
        from_attributes = True

    