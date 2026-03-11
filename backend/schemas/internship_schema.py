from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InternshipCreate(BaseModel):
    company: str
    position: str
    description: Optional[str] = None
    location: str
    start_date: datetime
    end_date: Optional[datetime] = None


class InternshipResponse(BaseModel):
    id: int
    company: str
    position: str
    description: Optional[str] = None
    location: str
    start_date: datetime
    end_date: Optional[datetime] = None

    class Config:
        from_attributes = True  