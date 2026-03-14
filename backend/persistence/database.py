from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings 

# ==============================================================================
# CONFIGURAÇÃO DO ENGINE E POOL DE CONEXÕES (DATABASE ENGINE)
# ==============================================================================
"""
O Engine gerencia a comunicação de baixo nível com o banco de dados.
Configuramos um pool robusto para garantir alta disponibilidade.
"""
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,             # Defina como True apenas para depuração de SQL
    pool_size=20,           # Conexões persistentes no pool
    max_overflow=30,        # Margem de segurança para picos de tráfego
    pool_timeout=60,        # Timeout para evitar travamento da thread
    pool_recycle=1800       # Previne desconexões por inatividade do servidor DB
)

# ==============================================================================
# FÁBRICA DE SESSÕES E MAPEAMENTO (ORM CORE)
# ==============================================================================
# SessionLocal será instanciada em cada requisição através da DI do FastAPI
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base herdada por todos os modelos (User, Event, News, etc.)
Base = declarative_base()

# ==============================================================================
# DEPENDÊNCIA DE BANCO DE DADOS (CONTEXT MANAGER)
# ==============================================================================
def get_db():
    """
    Fornece uma sessão de banco de dados para os endpoints do FastAPI.
    A sessão é aberta no início da requisição e encerrada automaticamente ao fim.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()