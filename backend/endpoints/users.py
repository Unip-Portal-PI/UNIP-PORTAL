from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from persistence.database import get_db
from business.services.auth_service import AuthService
from persistence.repositories.user_repository import UserRepository
from schemas.user_schema import UserCreate, UserResponse

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    created_user = service.register(user.name, user.email, user.password, user.role)
    if not created_user:
        raise HTTPException(status_code=400, detail="Erro ao registrar usuário")
    return created_user

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    token = service.login(email, password)
    if not token:
        raise HTTPException(status_code=400, detail="Credenciais inválidas")
    return {"access_token": token, "token_type": "bearer"}

@router.get("/", response_model=list[UserResponse])
def list_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    return service.list_users(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    updated_user = service.update_user(user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return updated_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db))
    deleted = service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário removido com sucesso"}