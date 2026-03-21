from sqlalchemy.orm import Session
from app.models.curso import CursoModel


class CursoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, curso_id: str) -> CursoModel | None:
        return self.db.query(CursoModel).filter(CursoModel.id_curso == curso_id).first()

    def get_by_nome(self, nome: str) -> CursoModel | None:
        return self.db.query(CursoModel).filter(CursoModel.nome_curso == nome).first()

    def list_all(self) -> list[CursoModel]:
        return self.db.query(CursoModel).all()
