from persistence.models.internship_model import InternshipModel
from sqlalchemy.orm import Session

from sqlalchemy.orm import Session
from persistence.models.internship_model import InternshipModel

class InternshipRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, internship: InternshipModel):
        self.db.add(internship)
        self.db.commit()
        self.db.refresh(internship)
        return internship

    def list_all(self, skip: int = 0, limit: int = 10):
        return (
            self.db.query(InternshipModel)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, internship_id: int):
        return (
            self.db.query(InternshipModel)
            .filter(InternshipModel.id == internship_id)
            .first()
        )

    def update(self, internship_id: int, internship_data):
        internship = self.get_by_id(internship_id)
        if not internship:
            return None
        for key, value in internship_data.dict().items():
            setattr(internship, key, value)
        self.db.commit()
        self.db.refresh(internship)
        return internship

    def delete(self, internship_id: int):
        internship = self.get_by_id(internship_id)
        if not internship:
            return None
        self.db.delete(internship)
        self.db.commit()
        return True