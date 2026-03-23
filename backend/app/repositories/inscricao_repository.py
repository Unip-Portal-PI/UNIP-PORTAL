from sqlalchemy.orm import Session, joinedload
from app.models.inscricao import InscricaoModel


class InscricaoRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(InscricaoModel).options(
            joinedload(InscricaoModel.usuario),
            joinedload(InscricaoModel.presenca),
        )

    def create(self, inscricao: InscricaoModel) -> InscricaoModel:
        self.db.add(inscricao)
        self.db.commit()
        self.db.refresh(inscricao)
        return inscricao

    def update(self, inscricao: InscricaoModel) -> InscricaoModel:
        self.db.add(inscricao)
        self.db.commit()
        self.db.refresh(inscricao)
        return inscricao

    def get_by_user_and_event(self, id_usuario: str, id_evento: str) -> InscricaoModel | None:
        return self._base_query().filter(
            InscricaoModel.id_usuario == id_usuario,
            InscricaoModel.id_evento == id_evento,
        ).first()

    def list_by_event(self, id_evento: str) -> list[InscricaoModel]:
        return self._base_query().filter(InscricaoModel.id_evento == id_evento).all()

    def list_by_user(self, id_usuario: str) -> list[InscricaoModel]:
        return self._base_query().filter(InscricaoModel.id_usuario == id_usuario).all()

    def get_by_qr_code(self, qr_code: str) -> InscricaoModel | None:
        return self._base_query().filter(InscricaoModel.qr_code_usuario == qr_code).first()

    def delete(self, inscricao: InscricaoModel) -> None:
        self.db.delete(inscricao)
        self.db.commit()
