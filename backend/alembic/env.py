import sys
from os.path import splitext, realpath, dirname
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Adiciona o diretório raiz ao sys.path para que o Python encontre os módulos do projeto
sys.path.append(dirname(dirname(realpath(__file__))))

from core.config import settings
from persistence.database import Base

# Importação dos modelos para que o Alembic detecte as tabelas para o Autogenerate
import persistence.models.user_model
import persistence.models.event_model
import persistence.models.internship_model
import persistence.models.audit_model        
import persistence.models.enrollment_model   
import persistence.models.news_model         

# Configuração do Alembic
config = context.config

# Interpreta o arquivo de log do alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    """Executa migrações em modo 'offline'."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Executa migrações em modo 'online'."""
    
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()