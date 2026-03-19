from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.config import settings
from persistence.database import get_db
from persistence.models.user_model import UserModel
from persistence.repositories.user_repository import UserRepository

# ==============================================================================
# CONFIGURAÇÕES DE CRIPTOGRAFIA E AUTH (SECURITY CORE)
# ==============================================================================
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# O tokenUrl deve apontar para o prefixo correto definido no seu main.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

# ==============================================================================
# GESTÃO DE SENHAS (HASHING ENGINE)
# ==============================================================================
def hash_password(password: str) -> str:
    """
    Transforma senha em texto plano em um hash seguro utilizando Argon2.
    Argon2 trunca senhas após 72 caracteres por design para evitar ataques DoS.
    """
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara uma senha fornecida com o hash armazenado no banco.
    """
    return pwd_context.verify(plain_password[:72], hashed_password)

# ==============================================================================
# LÓGICA DE AUTENTICAÇÃO (LOGIN CORE)
# ==============================================================================
def authenticate_user(registration: str, password: str, db: Session):
    """
    Valida as credenciais do usuário baseadas na MATRÍCULA.
    Retorna o UserModel se válido, caso contrário levanta exceção ou retorna False.
    """
    repository = UserRepository(db)
    
    # BUSCA PELA MATRÍCULA
    user = repository.get_by_registration(registration.strip())
    
    if not user:
        return False
        
    # Verificação de Conta Ativa (Importante para o fluxo de OTP)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Esta conta ainda não foi ativada. Verifique seu e-mail para validar o código OTP.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(password, user.password_hash):
        return False
        
    return user

# ==============================================================================
# TOKENS DE ACESSO (JWT ISSUANCE)
# ==============================================================================
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Gera um Token JWT assinado para autenticação do usuário.
    Inclui Claims como sub (ID) e role para controle de acesso rápido.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# ==============================================================================
# CONTROLE DE ACESSO (RBAC COM SINCRONIZAÇÃO DE BANCO)
# ==============================================================================

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Valida o token e verifica se o estado do usuário no banco condiz com o token.
    Impede que usuários cujas permissões foram alteradas ou contas desativadas
    continuem usando tokens antigos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão inválida ou expirada. Por favor, faça login novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role_from_token: str = payload.get("role")
        
        if user_id is None or role_from_token is None:
            raise credentials_exception
            
        # Busca o estado ATUAL no banco via ID (PrimaryKey)
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        
        if not user or not user.is_active:
            raise credentials_exception

        # RBAC Sync: Invalida o token se a Role no banco for diferente da Role no Token
        if user.role != role_from_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Suas permissões de acesso mudaram. Por segurança, faça login novamente.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return user
        
    except JWTError:
        raise credentials_exception

class RoleChecker:
    """
    Dependência injetável para proteção de rotas (Middleware de Role).
    Exemplo de uso: Depends(RoleChecker(["admin", "staff"]))
    """
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: UserModel = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso Negado: Sua função '{current_user.role}' não possui permissão para este recurso."
            )
        return current_user