from sqlalchemy.orm import Session, joinedload

from app.models.comunicado import ComunicadoModel


class ComunicadoRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(ComunicadoModel).options(
            joinedload(ComunicadoModel.criador),
        )

    def list_all(self) -> list[ComunicadoModel]:
        return self._base_query().order_by(ComunicadoModel.data_criacao.desc()).all()

    def list_by_creator(self, creator_id: str) -> list[ComunicadoModel]:
        return self._base_query().filter(
            ComunicadoModel.id_criador == creator_id
        ).order_by(ComunicadoModel.data_criacao.desc()).all()

    def get_by_id(self, comunicado_id: str) -> ComunicadoModel | None:
        return self._base_query().filter(
            ComunicadoModel.id_comunicado == comunicado_id
        ).first()

    def create(self, comunicado: ComunicadoModel) -> ComunicadoModel:
        self.db.add(comunicado)
        self.db.commit()
        self.db.refresh(comunicado)
        return comunicado

    def update(self, comunicado: ComunicadoModel) -> ComunicadoModel:
        self.db.commit()
        self.db.refresh(comunicado)
        return comunicado
