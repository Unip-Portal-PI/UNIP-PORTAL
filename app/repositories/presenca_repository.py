from sqlalchemy.orm import Session
from app.models.presenca import PresencaModel


class PresencaRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, presenca: PresencaModel) -> PresencaModel:
        self.db.add(presenca)
        self.db.commit()
        self.db.refresh(presenca)
        return presenca

    def get_by_inscricao(self, id_inscricao: str) -> PresencaModel | None:
        return self.db.query(PresencaModel).filter(
            PresencaModel.id_inscricao == id_inscricao
        ).first()

    def exists(self, id_inscricao: str) -> bool:
        return self.db.query(PresencaModel).filter(
            PresencaModel.id_inscricao == id_inscricao
        ).first() is not None
