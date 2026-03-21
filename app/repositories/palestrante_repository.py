from sqlalchemy.orm import Session
from app.models.palestrante import PalestranteModel


class PalestranteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, palestrante_id: str) -> PalestranteModel | None:
        return self.db.query(PalestranteModel).filter(
            PalestranteModel.id_palestrante == palestrante_id
        ).first()

    def list_all(self) -> list[PalestranteModel]:
        return self.db.query(PalestranteModel).all()
