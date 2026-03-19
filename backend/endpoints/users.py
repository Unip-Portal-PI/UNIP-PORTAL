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
    otp_code: str = Field(..., min_length=4, max_length=4)
    current_password: str
    new_password: str = Field(..., min_length=8)

class ForgotPasswordConfirm(BaseModel):
    email: str
    otp_code: str = Field(..., min_length=4, max_length=4)
    new_password: str = Field(..., min_length=8)

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
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Cadastra um novo usuário. 
    Obrigatoriedade: name, nickname, registration_number, email, password, area.
    """
    service = AuthService(UserRepository(db), AuditRepository(db))
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
    
    # Envio de e-mail apenas se não for o primeiro admin (que já nasce ativo)
    if created_user.otp_code:
        try:
            EmailService().send_verification_code(created_user.email, code=created_user.otp_code)
        except Exception:
            # Não trava o registro se o provedor de e-mail falhar, mas avisa
            pass
            
    return created_user

@router.post("/verify-otp")
def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    """Ativa a conta do usuário através do código enviado por e-mail."""
    service = AuthService(UserRepository(db), AuditRepository(db))
    success = service.activate_account(data.email, data.code)
    
    if not success:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado.")
    
    return {"message": "Conta ativada com sucesso! Agora você pode realizar o login."}

# ==============================================================================
# FLUXO DE ACESSO (LOGIN POR MATRÍCULA)
# ==============================================================================

@router.post("/login")
def login(
    registration: str = Body(..., description="Matrícula/RA"), 
    password: str = Body(...), 
    db: Session = Depends(get_db)
):
    """Realiza o login utilizando Matrícula e Senha."""
    service = AuthService(UserRepository(db), AuditRepository(db))
    result = service.login(registration, password)
    
    if not result:
        # Se retornar None, as credenciais estão erradas
        raise HTTPException(
            status_code=401, 
            detail="Matrícula ou senha incorretos."
        )
    return result

@router.post("/forgot-password/request")
def request_recovery_otp(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db), AuditRepository(db))
    otp = service.request_otp_by_email(email)
    if otp:
        EmailService().send_verification_code(email, code=otp)
    return {"message": "Se o e-mail existir, um código de recuperação foi enviado."}

@router.post("/forgot-password/confirm")
def confirm_recovery(data: ForgotPasswordConfirm, db: Session = Depends(get_db)):
    service = AuthService(UserRepository(db), AuditRepository(db))
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
def update_my_profile(user_data: UserUpdateSelf, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    service = AuthService(UserRepository(db), AuditRepository(db))
    updated = service.update_my_profile(user_id, user_data)
    if not updated:
        raise HTTPException(status_code=400, detail="Erro ao atualizar dados do perfil.")
    return updated

@router.post("/me/confirm-password-change")
def confirm_password_change(data: PasswordResetConfirm, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Troca de senha segura para usuário logado (exige OTP e senha atual)."""
    service = AuthService(UserRepository(db), AuditRepository(db))
    result = service.confirm_password_change(user_id, data.otp_code, data.current_password, data.new_password)
    if result != "success":
        raise HTTPException(status_code=400, detail=result)
    return {"message": "Senha alterada com sucesso."}

# --- ADMINISTRAÇÃO ---

@router.patch("/promote", dependencies=[Depends(require_admin)])
def manage_access(data: RoleUpdate, db: Session = Depends(get_db), admin_id: int = Depends(get_current_user_id)):
    service = AuthService(UserRepository(db), AuditRepository(db))
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
def delete_user(user_id: int, db: Session = Depends(get_db), admin_id: int = Depends(get_current_user_id)):
    service = AuthService(UserRepository(db), AuditRepository(db))
    result = service.delete_user(user_id, admin_id)
    
    if result == "self_delete_forbidden":
        raise HTTPException(status_code=403, detail="Você não pode desativar sua própria conta.")
    if not result:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return {"message": "Usuário desativado com sucesso."}