import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

import app.models

from app.controllers.auth_controller import router as auth_router
from app.controllers.comunicado_controller import router as comunicado_router
from app.controllers.evento_controller import router as evento_router
from app.controllers.file_controller import router as file_router
from app.controllers.inscricao_controller import router as inscricao_router
from app.controllers.usuario_controller import router as usuario_router
from app.core.config import settings
from app.core.storage import storage_service

logger = logging.getLogger("app.errors")

app = FastAPI(
    title="AVP Conecta",
    description="API REST - Sistema de Gestao de Eventos Academicos",
    version="2.0.0",
)

cors_allowed_origins = [
    origin.strip()
    for origin in settings.CORS_ALLOW_ORIGINS.split(",")
    if origin.strip()
]
if not cors_allowed_origins:
    cors_allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    original = getattr(exc, "orig", None)
    error_code = None
    error_message = str(original) if original else str(exc)

    if hasattr(original, "args") and original.args:
        error_code = original.args[0]
        if len(original.args) > 1:
            error_message = str(original.args[1])

    logger.error(
        "integrity_error method=%s path=%s code=%s message=%s",
        request.method,
        request.url.path,
        error_code,
        error_message,
        exc_info=True,
    )

    # MySQL duplicate key
    if error_code == 1062:
        detail = "Conflito de dados: registro duplicado."
    # MySQL column cannot be null
    elif error_code == 1048:
        detail = "Conflito de dados: existe relacionamento obrigatorio impedindo a operacao."
    # MySQL foreign key constraint fails (parent/child)
    elif error_code in (1451, 1452):
        detail = "Conflito de dados: violacao de integridade referencial."
    else:
        detail = "Conflito de dados ao persistir informacoes."

    return JSONResponse(
        status_code=400,
        content={"detail": detail},
    )


@app.on_event("startup")
def setup_storage():
    storage_service.ensure_bucket()

app.include_router(auth_router)
app.include_router(comunicado_router)
app.include_router(evento_router)
app.include_router(file_router)
app.include_router(inscricao_router)
app.include_router(usuario_router)


@app.get("/", tags=["Diagnostico"])
def root():
    return {
        "status": "online",
        "message": "AVP Conecta - API v2.0.0",
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=7000, reload=True)
