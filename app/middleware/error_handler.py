import logging
import time
import traceback

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.errors")


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware que captura excecoes nao tratadas e gera logs estruturados."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000

            # Loga respostas com erro do servidor (5xx)
            if response.status_code >= 500:
                logger.error(
                    "server_error method=%s path=%s status=%s duration_ms=%.1f",
                    request.method,
                    request.url.path,
                    response.status_code,
                    duration_ms,
                    extra={
                        "request_method": request.method,
                        "request_path": request.url.path,
                        "status_code": response.status_code,
                        "client_ip": request.client.host if request.client else None,
                    },
                )

            return response

        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            client_ip = request.client.host if request.client else None

            logger.critical(
                "unhandled_exception method=%s path=%s client_ip=%s duration_ms=%.1f error=%s",
                request.method,
                request.url.path,
                client_ip,
                duration_ms,
                str(exc),
                exc_info=True,
                extra={
                    "request_method": request.method,
                    "request_url": str(request.url),
                    "request_path": request.url.path,
                    "client_ip": client_ip,
                    "detail": traceback.format_exc(),
                },
            )

            return JSONResponse(
                status_code=500,
                content={"detail": "Erro interno do servidor."},
            )
