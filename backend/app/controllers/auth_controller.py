import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest, LoginResponse,
    CadastroRequest, CadastroResponse,
    ResetPreviewRequest, ResetPreviewResponse,
    ResetSolicitarRequest, ResetValidarRequest, ResetValidarResponse,
    ResetRedefinirRequest, MensagemResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticacao"])
logger = logging.getLogger("app.auth")


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    logger.info("login_request ip=%s value=%s", client_ip, data.matricula.strip())
    try:
        response = auth_service.login(data, db)
        logger.info(
            "login_response ip=%s value=%s success=%s message=%s",
            client_ip,
            data.matricula.strip(),
            response.sucesso,
            response.mensagem,
        )
        return response
    except HTTPException as exc:
        logger.warning(
            "login_http_exception ip=%s value=%s status=%s detail=%s",
            client_ip,
            data.matricula.strip(),
            exc.status_code,
            exc.detail,
        )
        raise


@router.post("/cadastro", response_model=CadastroResponse)
def cadastro(data: CadastroRequest, db: Session = Depends(get_db)):
    return auth_service.register(data, db)


@router.post("/reset-senha/solicitar", response_model=MensagemResponse)
def reset_solicitar(data: ResetSolicitarRequest, db: Session = Depends(get_db)):
    return auth_service.request_reset(data.matricula, data.email, db)


@router.post("/reset-senha/preview", response_model=ResetPreviewResponse)
def reset_preview(data: ResetPreviewRequest, db: Session = Depends(get_db)):
    return auth_service.preview_reset_target_by_matricula(data.matricula, db)


@router.post("/reset-senha/validar", response_model=ResetValidarResponse)
def reset_validar(data: ResetValidarRequest, db: Session = Depends(get_db)):
    return auth_service.validate_otp(data.email, data.codigo, db)


@router.post("/reset-senha/redefinir", response_model=MensagemResponse)
def reset_redefinir(data: ResetRedefinirRequest, db: Session = Depends(get_db)):
    return auth_service.reset_password(data.token_redefinicao, data.nova_senha, db)
