from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Configurações Globais da Aplicação InfoUnityV4.
    Define as variáveis de ambiente necessárias para a execução do sistema via Resend API.
    """

    # ==============================================================================
    # PARÂMETROS DE SEGURANÇA (JWT)
    # ==============================================================================
    SECRET_KEY: str 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ==============================================================================
    # INFRAESTRUTURA E PERSISTÊNCIA (DATABASE)
    # ==============================================================================
    DATABASE_URL: str

    # ==============================================================================
    # SERVIÇOS DE COMUNICAÇÃO (RESEND API)
    # ==============================================================================
    # Substituímos o SMTP antigo pela API Key da Resend
    RESEND_API_KEY: str
    EMAIL_FROM: str

    # ==============================================================================
    # CONFIGURAÇÕES DE NEGÓCIO (OTP)
    # ==============================================================================
    OTP_LENGTH: int = 6
    OTP_EXPIRATION_MINUTES: int = 10

    # ==============================================================================
    # CONFIGURAÇÃO DO CARREGAMENTO (ENV)
    # ==============================================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" 
    )

# ==============================================================================
# INSTANCIAÇÃO (SINGLETON)
# ==============================================================================
# Ao instanciar, o Pydantic lerá o .env e validará se as chaves acima existem.
settings = Settings()