from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from persistence.database import Base

# ==============================================================================
# DEFINIÇÃO DA ENTIDADE DE USUÁRIO (IDENTITY & ACCESS MANAGEMENT)
# ==============================================================================
class UserModel(Base):
    """
    Modelo de representação de usuários (Alunos, Colaboradores e Admins).
    Gerencia credenciais, perfis de acesso (RBAC) e estados de ativação.
    """
    
    # Nome físico da tabela no Banco de Dados
    __tablename__ = "users"

    # ==========================================================================
    # IDENTIFICADORES E CHAVES
    # ==========================================================================
    # Chave primária única para cada usuário
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================================================
    # ATRIBUTOS DE IDENTIDADE E CONTATO
    # ==========================================================================
    # Nome completo do usuário para fins cadastrais
    name = Column(String(100), nullable=False)
    
    # Matrícula Acadêmica (ID de negócio único e indexado)
    registration_number = Column(String(20), unique=True, index=True, nullable=False)
    
    # Email institucional (Login do usuário)
    email = Column(String(100), unique=True, index=True, nullable=False)

    # ==========================================================================
    # SEGURANÇA E AUTENTICAÇÃO (RBAC)
    # ==========================================================================
    # Hash da senha (BCrypt/Argon2) - Persistência do segredo criptografado
    password_hash = Column(String(255), nullable=False)
    
    # Nível de acesso: 'Administrador', 'Colaborador' ou 'Aluno'
    role = Column(String(50), nullable=False)

    # ==========================================================================
    # ESTADOS E FLUXO DE VERIFICAÇÃO (OTP)
    # ==========================================================================
    # Define se a conta foi ativada via código de verificação
    is_active = Column(Boolean, default=False)
    
    # Código temporário de 4 dígitos para ativação inicial ou recuperação
    otp_code = Column(String(4), nullable=True)

    # ==========================================================================
    # MAPEAMENTO DE RELACIONAMENTOS (BACK-REFERENCES)
    # ==========================================================================
    # Permite acessar as inscrições e logs do usuário de forma reversa
    # enrollments = relationship("EnrollmentModel", back_populates="user")