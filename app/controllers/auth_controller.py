from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest, LoginResponse,
    CadastroRequest, CadastroResponse,
    ResetSolicitarRequest, ResetValidarRequest, ResetValidarResponse,
    ResetRedefinirRequest, MensagemResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticacao"])


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(data, db)


@router.post("/login/swagger", include_in_schema=False)
def login_swagger(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    data = LoginRequest(matricula=form.username, senha=form.password)
    result = auth_service.login(data, db)
    if not result.sucesso:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail=result.mensagem)
    return {"access_token": result.token, "token_type": "bearer"}


@router.post("/cadastro", response_model=CadastroResponse)
def cadastro(data: CadastroRequest, db: Session = Depends(get_db)):
    return auth_service.register(data, db)


@router.post("/reset-senha/solicitar", response_model=MensagemResponse)
def reset_solicitar(data: ResetSolicitarRequest, db: Session = Depends(get_db)):
    return auth_service.request_reset(data.email, db)


@router.post("/reset-senha/validar", response_model=ResetValidarResponse)
def reset_validar(data: ResetValidarRequest, db: Session = Depends(get_db)):
    return auth_service.validate_otp(data.email, data.codigo, db)


@router.post("/reset-senha/redefinir", response_model=MensagemResponse)
def reset_redefinir(data: ResetRedefinirRequest, db: Session = Depends(get_db)):
    return auth_service.reset_password(data.token_redefinicao, data.nova_senha, db)
