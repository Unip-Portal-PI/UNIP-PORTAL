import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

from app.controllers.auth_controller import router as auth_router
from app.controllers.evento_controller import router as evento_router
from app.controllers.inscricao_controller import router as inscricao_router


def bootstrap_storage():
    directories = ["static/banners", "static/qrcodes"]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)


bootstrap_storage()

app = FastAPI(
    title="AVP Conecta",
    description="API REST - Sistema de Gestao de Eventos Academicos",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Conflito de dados: Este registro ja existe no sistema."},
    )


if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router)
app.include_router(evento_router)
app.include_router(inscricao_router)


@app.get("/", tags=["Diagnostico"])
def root():
    return {
        "status": "online",
        "message": "AVP Conecta - API v2.0.0",
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
