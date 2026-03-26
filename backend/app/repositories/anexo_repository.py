from sqlalchemy.orm import Session
from app.models.anexo import AnexoModel


class AnexoRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, anexo: AnexoModel) -> AnexoModel:
        self.db.add(anexo)
        self.db.commit()
        self.db.refresh(anexo)
        return anexo

    def list_by_evento(self, id_evento: str) -> list[AnexoModel]:
        return self.db.query(AnexoModel).filter(AnexoModel.id_evento == id_evento).all()

    def delete(self, anexo: AnexoModel) -> None:
        self.db.delete(anexo)
        self.db.commit()
