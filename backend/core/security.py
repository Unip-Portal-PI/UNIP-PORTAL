from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ==============================================================================
# CONFIGURAÇÕES DE CRIPTOGRAFIA E AUTH (SECURITY CORE)
# ==============================================================================
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Define a rota de token para a documentação automática do Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

# ==============================================================================
# GESTÃO DE SENHAS (HASHING ENGINE)
# ==============================================================================
def hash_password(password: str) -> str:
    """
    Transforma senha em texto plano em um hash seguro utilizando Argon2.
    Nota: Argon2 trunca senhas após 72 caracteres por design.
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
# TOKENS DE ACESSO (JWT ISSUANCE)
# ==============================================================================
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Gera um Token JWT assinado para autenticação do usuário.
    """
    to_encode = data.copy()
    
    # Define o tempo de expiração (Usa Timezone UTC para evitar erros de servidor)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Assina o token com a SECRET_KEY configurada no .env
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# ==============================================================================
# CONTROLE DE ACESSO (RBAC - ROLE-BASED ACCESS CONTROL)
# ==============================================================================
def get_current_user_role(token: str = Depends(oauth2_scheme)):
    """
    Filtro de extração de identidade. Valida o token e extrai a role do usuário.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodifica o token e valida a integridade
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        role: str = payload.get("role")
        
        if role is None:
            raise credentials_exception
        return role
        
    except JWTError:
        raise credentials_exception

class RoleChecker:
    """
    Middleware injetável para proteção de rotas por nível de acesso.
    
    Exemplo:
        @router.post("/", dependencies=[Depends(RoleChecker(["Administrador"]))])
    """
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, role: str = Depends(get_current_user_role)):
        """
        Verifica se o papel do usuário está no grupo de permissão da rota.
        """
        if role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso Negado: Sua função não possui permissão para esta ação."
            )