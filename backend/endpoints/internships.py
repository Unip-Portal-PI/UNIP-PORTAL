from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from persistence.database import get_db
from business.services.internship_service import InternshipService
from persistence.repositories.internship_repository import InternshipRepository
from schemas.internship_schema import InternshipCreate, InternshipResponse
from persistence.models.internship_model import InternshipModel

router = APIRouter()

@router.post("/", response_model=InternshipResponse)
def create_internship(internship: InternshipCreate, db: Session = Depends(get_db)):
    service = InternshipService(InternshipRepository(db))
    created = service.create_internship(
        internship.company,
        internship.position,
        internship.description,
        internship.location,
        internship.start_date,
        internship.end_date
    )
    if not created:
        raise HTTPException(status_code=400, detail="Erro ao criar estágio")
    return created

@router.get("/", response_model=list[InternshipResponse])
def list_internships(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    service = InternshipService(InternshipRepository(db))
    return service.list_internships(skip=skip, limit=limit)

@router.get("/{internship_id}", response_model=InternshipResponse)
def get_internship(internship_id: int, db: Session = Depends(get_db)):
    service = InternshipService(InternshipRepository(db))
    internship = service.get_internship(internship_id)
    if not internship:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")
    return internship

@router.put("/{internship_id}", response_model=InternshipResponse)
def update_internship(internship_id: int, internship: InternshipCreate, db: Session = Depends(get_db)):
    service = InternshipService(InternshipRepository(db))
    updated = service.update_internship(internship_id, internship)
    if not updated:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")
    return updated

@router.delete("/{internship_id}")
def delete_internship(internship_id: int, db: Session = Depends(get_db)):
    service = InternshipService(InternshipRepository(db))
    deleted = service.delete_internship(internship_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")
    return {"message": "Estágio removido com sucesso"}