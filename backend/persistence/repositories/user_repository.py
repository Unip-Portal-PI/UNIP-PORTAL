from sqlalchemy.orm import Session
from persistence.models.user_model import UserModel
from sqlalchemy import Column, Integer, String

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user: UserModel):
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: int):
        return self.db.query(UserModel).filter(UserModel.id == user_id).first()

    def get_by_email(self, email: str):
        return self.db.query(UserModel).filter(UserModel.email == email).first()

    def list(self, skip: int = 0, limit: int = 10):
        return self.db.query(UserModel).offset(skip).limit(limit).all()

    def update(self, user_id: int, user_data):
        user = self.get_by_id(user_id)
        if not user:
            return None
        for key, value in user_data.dict().items():
            if key != "password": 
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int):
        user = self.get_by_id(user_id)
        if not user:
            return None
        self.db.delete(user)
        self.db.commit()
        return True
