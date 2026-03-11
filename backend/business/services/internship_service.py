from persistence.repositories.internship_repository import InternshipRepository
from persistence.models.internship_model import InternshipModel

class InternshipService:
    def __init__(self, repo: InternshipRepository):
        self.repo = repo

    def create_internship(self, company, position, description, location, start_date, end_date):
        internship = InternshipModel(
            company=company,
            position=position,
            description=description,
            location=location,
            start_date=start_date,
            end_date=end_date
        )
        return self.repo.create(internship)

    def list_internships(self, skip: int = 0, limit: int = 10):
        return self.repo.list_all(skip=skip, limit=limit)

    def get_internship(self, internship_id: int):
        return self.repo.get_by_id(internship_id)

    def update_internship(self, internship_id: int, internship_data):
        return self.repo.update(internship_id, internship_data)

    def delete_internship(self, internship_id: int):
        return self.repo.delete(internship_id)