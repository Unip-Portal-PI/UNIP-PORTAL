from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Configurações Globais da Aplicação.
    Define as variáveis de ambiente necessárias para a execução do sistema.
    O Pydantic exigirá que estas chaves existam no arquivo .env.
    """

    # ==============================================================================
    # PARÂMETROS DE SEGURANÇA (JWT)
    # ==============================================================================
    SECRET_KEY: str 
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # ==============================================================================
    # INFRAESTRUTURA E PERSISTÊNCIA (DATABASE)
    # ==============================================================================
    DATABASE_URL: str

    # ==============================================================================
    # SERVIÇOS DE COMUNICAÇÃO (EMAIL SERVICE)
    # ==============================================================================
    EMAIL_API_URL: str
    EMAIL_API_KEY: str
    EMAIL_FROM: str

    # ==============================================================================
    # CONFIGURAÇÃO DO CARREGAMENTO (ENV)
    # ==============================================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

# ==============================================================================
# INSTANCIAÇÃO (SINGLETON)
# ==============================================================================
# Instância única para uso em todo o projeto
settings = Settings()