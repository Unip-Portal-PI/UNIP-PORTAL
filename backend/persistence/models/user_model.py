from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import relationship
from persistence.database import Base

# ==============================================================================
# DEFINIÇÃO DA ENTIDADE DE USUÁRIO (IDENTITY & ACCESS MANAGEMENT)
# ==============================================================================
class UserModel(Base):
    """
    Modelo de representação de usuários.
    Armazena dados cadastrais, credenciais e nível de acesso (RBAC).
    """
    
    __tablename__ = "users"

# ==============================================================================
# IDENTIFICADORES
# ==============================================================================
    id = Column(Integer, primary_key=True, index=True)

# ==============================================================================
# ATRIBUTOS DE IDENTIDADE (OBRIGATÓRIOS)
# ==============================================================================
    name = Column(String(100), nullable=False)
    nickname = Column(String(50), nullable=False) # Apelido obrigatório
    registration_number = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    area = Column(String(100), nullable=False) # Área acadêmica/setor obrigatória

# ==============================================================================
# ATRIBUTOS COMPLEMENTARES (OPCIONAIS)
# ==============================================================================
    phone = Column(String(20), nullable=True)
    birth_date = Column(Date, nullable=True)

# ==============================================================================
# SEGURANÇA E RBAC
# ==============================================================================
    # Armazena o hash (Argon2) da senha, nunca o texto plano
    password_hash = Column(String(255), nullable=False)
    
    # Nível de acesso: 'admin', 'staff' ou 'student'
    role = Column(String(50), nullable=False, default="student")

# ==============================================================================
# ESTADOS DE CONTA E VALIDAÇÃO
# ==============================================================================
    is_active = Column(Boolean, default=False) # Alunos começam inativos (aguardando OTP)
    otp_code = Column(String(4), nullable=True) # Código de 4 dígitos para ativação/recuperação

# =============================================================================
# RELACIONAMENTOS (EXPANSÍVEL)
# ==============================================================================
    # enrollments = relationship("EnrollmentModel", back_populates="user")

    def __repr__(self):
        return f"<UserModel(name={self.name}, registration={self.registration_number}, role={self.role})>"