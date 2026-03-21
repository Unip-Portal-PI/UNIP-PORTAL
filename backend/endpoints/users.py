from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from typing import List

from persistence.database import get_db
from business.services.auth_service import AuthService
from business.services.email_service import EmailService
from persistence.repositories.user_repository import UserRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.user_schema import UserCreate, UserResponse, UserUpdateSelf
from core.security import RoleChecker, oauth2_scheme, settings
from persistence import models

router = APIRouter(prefix="", tags=["Users & Auth"])

# ==============================================================================
# SCHEMAS PARA REQUISIÇÕES LOCAIS
# ==============================================================================

class VerifyOTP(BaseModel):
    email: str 
    code: str

class RoleUpdate(BaseModel):
    user_id: int
    new_role: str  # 'student', 'staff' ou 'admin'

class PasswordResetConfirm(BaseModel):
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

class ForgotPasswordConfirm(BaseModel):
    email: str
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

# ==============================================================================
# DEPENDÊNCIAS DE SERVIÇO
# ==============================================================================

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Centraliza a criação do AuthService com todas as dependências."""
    return AuthService(
        repo=UserRepository(db), 
        audit_repo=AuditRepository(db), 
        email_service=EmailService()
    )

# ==============================================================================
# SEGURANÇA
# ==============================================================================

require_admin = RoleChecker(["admin"])

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Sessão inválida.")

# ==============================================================================
# FLUXO DE REGISTRO E ATIVAÇÃO (PÚBLICO) 
# ==============================================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, service: AuthService = Depends(get_auth_service)):
    """Cadastra um novo usuário e envia e-mail de ativação."""
    created_user = service.register(
        name=user.name,
        nickname=user.nickname,
        registration_number=user.registration_number,
        email=user.email,
        password=user.password,
        area=user.area,
        phone=user.phone,
        birth_date=user.birth_date
    )
    
    if not created_user:
        raise HTTPException(
            status_code=400, 
            detail="E-mail ou Matrícula já cadastrados no sistema."
        )
            
    return created_user

@router.post("/verify-otp")
def verify_otp(data: VerifyOTP, service: AuthService = Depends(get_auth_service)):
    """Ativa a conta do usuário através do código enviado por e-mail."""
    success = service.activate_account(data.email, data.code)
    
    if not success:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado.")
    
    return {"message": "Conta ativada com sucesso! Agora você pode realizar o login."}

# ==============================================================================
# FLUXO DE ACESSO (LOGIN E RECUPERAÇÃO ESQUECIDA)
# ==============================================================================

@router.post("/login")
def login(
    registration: str = Body(..., description="Matrícula/RA"), 
    password: str = Body(...), 
    service: AuthService = Depends(get_auth_service)
):
    """Realiza o login utilizando Matrícula e Senha."""
    result = service.login(registration, password)
    
    if not result:
        raise HTTPException(
            status_code=401, 
            detail="Matrícula ou senha incorretos."
        )
    return result

@router.post("/forgot-password/request")
def request_recovery_otp(
    email: str = Body(..., embed=True), 
    service: AuthService = Depends(get_auth_service)
):
    """Gera e envia via e-mail o código de recuperação para quem esqueceu a senha."""
    service.request_otp_by_email(email)
    return {"message": "Se o e-mail existir, um código de recuperação foi enviado."}

@router.post("/forgot-password/confirm")
def confirm_recovery(data: ForgotPasswordConfirm, service: AuthService = Depends(get_auth_service)):
    """Confirma a recuperação de senha utilizando o código enviado por e-mail."""
    if not service.recover_password_with_otp(data.email, data.otp_code, data.new_password):
        raise HTTPException(status_code=400, detail="Código inválido ou usuário não encontrado.")
    return {"message": "Senha redefinida com sucesso."}

# ==============================================================================
# GESTÃO DE PERFIL (LOGADO)
# ==============================================================================

@router.get("/me", response_model=UserResponse)
def get_my_profile(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    user = UserRepository(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    user_data: UserUpdateSelf, 
    service: AuthService = Depends(get_auth_service), 
    user_id: int = Depends(get_current_user_id)
):
    updated = service.update_my_profile(user_id, user_data)
    if not updated:
        raise HTTPException(status_code=400, detail="Erro ao atualizar dados do perfil.")
    return updated
# ==============================================================================
# NOVAS ROTAS DE TROCA DE SENHA (PARA USUÁRIO LOGADO)
# ==============================================================================

@router.post("/me/request-password-otp")
def request_password_change_otp(
    user_id: int = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service)
):
    """Solicita código de troca de senha para o usuário que já está logado."""
    # O AuthService deve implementar o envio via e-mail do usuário pelo ID
    success = service.request_password_change_otp(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"message": "Código de verificação enviado para o seu e-mail."}

@router.post("/me/confirm-password-change")
def confirm_password_change(
    data: PasswordResetConfirm,
    user_id: int = Depends(get_current_user_id),
    service: AuthService = Depends(get_auth_service)
):
    """Confirma a troca de senha do usuário logado validando o código enviado."""
    success = service.confirm_password_change(user_id, data.otp_code, data.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado.")
    return {"message": "Senha alterada com sucesso!"}

# ==============================================================================
# ADMINISTRAÇÃO
# ==============================================================================

@router.patch("/promote", dependencies=[Depends(require_admin)])
def manage_access(
    data: RoleUpdate, 
    service: AuthService = Depends(get_auth_service), 
    admin_id: int = Depends(get_current_user_id)
):
    result = service.update_user_access(admin_id, data.user_id, data.new_role)
    
    if result == "user_not_found":
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if result == "invalid_role":
        raise HTTPException(status_code=400, detail="Nível de acesso inválido.")
    
    return {"message": f"Nível de acesso do usuário {data.user_id} alterado para '{data.new_role}'."}

@router.get("/all", response_model=List[UserResponse], dependencies=[Depends(require_admin)])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return UserRepository(db).list(skip, limit)

@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
def delete_user(
    user_id: int, 
    service: AuthService = Depends(get_auth_service), 
    admin_id: int = Depends(get_current_user_id)
):
    result = service.delete_user(user_id, admin_id)
    
    if result == "self_delete_forbidden":
        raise HTTPException(status_code=403, detail="Você não pode desativar sua própria conta.")
    if not result:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"message": "Usuário desativado com sucesso."}