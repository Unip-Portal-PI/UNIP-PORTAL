from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

class UserResponse(BaseModel):
    id: Optional[int] = None
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True

    