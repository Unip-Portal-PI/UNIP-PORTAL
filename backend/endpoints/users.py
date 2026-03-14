from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import BaseModel

from persistence.database import get_db
from business.services.auth_service import AuthService
from business.services.email_service import EmailService
from persistence.repositories.user_repository import UserRepository
from persistence.repositories.audit_repository import AuditRepository
from schemas.user_schema import UserCreate, UserResponse, UserUpdateSelf
from core.security import RoleChecker, oauth2_scheme, settings
from persistence.models.user_model import UserModel

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR E SCHEMAS LOCAIS
# ==============================================================================
router = APIRouter()

class VerifyOTP(BaseModel):
    """Schema para validação do código de ativação de 4 dígitos."""
    email: str
    code: str

# ==============================================================================
# SEGURANÇA E EXTRAÇÃO DE IDENTIDADE
# ==============================================================================
require_admin = RoleChecker(["Administrador"])

def get_current_user_id(token: str) -> str:
    """Valida o Token e extrai o identificador único (sub)."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida.")

# ==============================================================================
# FLUXO DE ONBOARDING (REGISTRO & ATIVAÇÃO)
# ==============================================================================
@router.post(
    "/register", 
    response_model=UserResponse,
    summary="Cadastra um novo usuário",
    tags=["Auth - Registro"]
)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Inicia o cadastro com conta inativa e gera código de verificação."""
    service = AuthService(UserRepository(db), AuditRepository(db))
    created_user = service.register(
        name=user.name, 
        registration_number=user.registration_number, 
        email=user.email, 
        password=user.password, 
        role=user.role
    )
    
    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="E-mail ou Matrícula já constam em nossa base."
        )
    
    # Disparo de E-mail Assíncrono (Simulado)
    email_service = EmailService()
    email_service.send_verification_code(created_user.email, code=created_user.otp_code)
    
    return created_user

@router.post(
    "/verify-otp",
    summary="Ativa a conta via código OTP",
    tags=["Auth - Registro"]
)
def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    """Valida o código enviado ao e-mail para habilitar o acesso total."""
    user = db.query(UserModel).filter(UserModel.email == data.email.lower().strip()).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não localizado.")
    
    if user.is_active:
        return {"message": "Sua conta já está ativa e pronta para uso."}

    if user.otp_code != data.code:
        raise HTTPException(status_code=400, detail="Código de verificação incorreto ou expirado.")
    
    user.is_active = True
    user.otp_code = None
    db.commit()
    
    return {"status": "success", "message": "Parabéns! Sua conta foi ativada."}

# ==============================================================================
# FLUXO DE ACESSO (LOGIN)
# ==============================================================================
@router.post(
    "/login",
    summary="Autenticação e geração de JWT",
    tags=["Auth - Login"]
)
def login(email: str = Body(...), password: str = Body(...), db: Session = Depends(get_db)):
    """Valida credenciais e retorna o token de acesso para a sessão."""
    service = AuthService(UserRepository(db), AuditRepository(db))
    result = service.login(email, password)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="E-mail/Senha incorretos ou conta pendente de ativação."
        )
    return result

# ==============================================================================
# GESTÃO DE PERFIL (SELF-SERVICE)
# ==============================================================================
@router.get(
    "/me", 
    response_model=UserResponse,
    summary="Recupera dados do usuário logado",
    tags=["Perfil"]
)
def get_my_profile(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """Acessa as informações privadas do próprio usuário logado."""
    user_id = get_current_user_id(token)
    service = AuthService(UserRepository(db), AuditRepository(db))
    user = service.repo.get_by_id(int(user_id))
    return user

@router.put(
    "/me", 
    response_model=UserResponse,
    summary="Atualiza dados do próprio perfil",
    tags=["Perfil"]
)
def update_my_profile(
    user_data: UserUpdateSelf, 
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    """Permite alteração de dados pessoais com rastro de auditoria."""
    user_id = get_current_user_id(token)
    service = AuthService(UserRepository(db), AuditRepository(db))
    return service.update_my_profile(int(user_id), user_data)

# ==============================================================================
# ADMINISTRAÇÃO (ROOT PRIVILEGES)
# ==============================================================================
@router.delete(
    "/{user_id}", 
    dependencies=[Depends(require_admin)],
    summary="Desativa um usuário (Admin)",
    tags=["Administração"]
)
def delete_user(user_id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    """Remove acesso de um usuário. Bloqueado para auto-exclusão."""
    current_admin_id = get_current_user_id(token)
    service = AuthService(UserRepository(db), AuditRepository(db))
    result = service.delete_user(user_id, int(current_admin_id))
    
    if result == "self_delete_forbidden":
        raise HTTPException(status_code=403, detail="Atenção: Não é possível excluir sua própria conta administrativa.")
    if not result:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    return {"status": "success", "message": "Conta desativada com sucesso."}