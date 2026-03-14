from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
import os

# ==============================================================================
# IMPORTAÇÃO DE MÓDULOS E ROUTERS
# ==============================================================================
from endpoints import (
    users, events, internships, news, 
    admin, enrollments, certificates, student
)

# ==============================================================================
# CONFIGURAÇÕES DE AMBIENTE E SISTEMA DE ARQUIVOS
# ==============================================================================
def bootstrap_storage():
    """Garante a existência dos diretórios necessários para uploads e arquivos estáticos."""
    directories = [
        "static/banners",
        "static/qrcodes",
        "static/certificates"
    ]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

bootstrap_storage()

# ==============================================================================
# INSTANCIAÇÃO DA API
# ==============================================================================
app = FastAPI(
    title="AVP UNIP", 
    description="Sistema de Gestão Acadêmica: Usuários com ativação OTP, Eventos, QR Code e Certificados.",
    version="1.3.0"
)

# ==============================================================================
# CONFIGURAÇÃO DE MIDDLEWARES
# ==============================================================================
# Define as permissões de acesso (CORS) para integração com o Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# TRATAMENTO GLOBAL DE EXCEÇÕES
# ==============================================================================
@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    """
    Captura erros de integridade do banco de dados (ex: e-mail ou matrícula duplicados).
    Retorna uma resposta amigável em vez de um erro 500.
    """
    return JSONResponse(
        status_code=400,
        content={"detail": "Conflito de dados: Este registro (E-mail ou Matrícula) já existe no sistema."}
    )

# ==============================================================================
# SERVIÇOS DE ARQUIVOS ESTÁTICOS
# ==============================================================================
# Montagem da rota para acesso público a mídias e documentos
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# ==============================================================================
# REGISTRO DE ROTAS (ENDPOINTS)
# ==============================================================================
# Núcleo de Identidade e Acesso
app.include_router(users, prefix="/users", tags=["Gestão de Usuários"])

# Visão e Experiência do Usuário
app.include_router(student, prefix="/student", tags=["Dashboard do Aluno"])

# Gestão de Eventos e Fluxo de Presença
app.include_router(events, prefix="/events", tags=["Eventos Acadêmicos"])
app.include_router(enrollments, prefix="/enrollments", tags=["Inscrições e QR Code"])

# Conteúdo Acadêmico e Oportunidades
app.include_router(internships, prefix="/internships", tags=["Vagas de Estágio"])
app.include_router(news, prefix="/news", tags=["Comunicados e Notícias"])

# Saídas de Dados e Administração
app.include_router(certificates, prefix="/certificates", tags=["Certificados"])
app.include_router(admin, prefix="/admin", tags=["Administração Central"])

# ==============================================================================
# ENDPOINTS DE SAÚDE DO SISTEMA
# ==============================================================================
@app.get("/", tags=["Diagnóstico"])
def root():
    """Retorna o status operacional e metadados da API."""
    return {
        "status": "online",
        "message": "AVP UNIP - Sistema de Segurança com OTP ativado!",
        "version": "1.3.0",
        "methods": {
            "auth": "JWT + OTP (4 digits)",
            "storage": "Local Filesystem (Static)"
        }
    }

# ==============================================================================
# INICIALIZAÇÃO DO SERVIDOR
# ==============================================================================
if __name__ == "__main__":
    import uvicorn
    # Inicia o servidor ASGI com recarga automática para desenvolvimento
    uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=True)