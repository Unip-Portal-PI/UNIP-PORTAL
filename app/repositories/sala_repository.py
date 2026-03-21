from sqlalchemy.orm import Session
from app.models.sala import SalaModel


class SalaRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, sala_id: str) -> SalaModel | None:
        return self.db.query(SalaModel).filter(SalaModel.id_sala == sala_id).first()

    def list_all(self) -> list[SalaModel]:
        return self.db.query(SalaModel).all()

    def create(self, sala: SalaModel) -> SalaModel:
        self.db.add(sala)
        self.db.commit()
        self.db.refresh(sala)
        return sala
