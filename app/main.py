import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

from app.controllers.auth_controller import router as auth_router
from app.controllers.comunicado_controller import router as comunicado_router
from app.controllers.evento_controller import router as evento_router
from app.controllers.file_controller import router as file_router
from app.controllers.inscricao_controller import router as inscricao_router
from app.controllers.usuario_controller import router as usuario_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.storage import storage_service
from app.middleware.error_handler import ErrorHandlerMiddleware

setup_logging()
logger = logging.getLogger("app.main")

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
app.add_middleware(ErrorHandlerMiddleware)


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    logger.warning(
        "integrity_error method=%s path=%s error=%s",
        request.method,
        request.url.path,
        str(exc.orig) if exc.orig else str(exc),
    )
    return JSONResponse(
        status_code=400,
        content={"detail": "Conflito de dados: Este registro ja existe no sistema."},
    )


@app.on_event("startup")
def setup_storage():
    try:
        storage_service.ensure_bucket()
    except Exception as exc:
        logger.warning("minio_unavailable error=%s — file storage disabled", exc)
    logger.info("application_startup version=2.0.0")

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
