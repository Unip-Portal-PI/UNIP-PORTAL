import logging
import logging.handlers
import json
import os
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Formatter que gera logs estruturados em JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info),
            }

        # Campos extras adicionados via extra={} no log call
        for key in ("request_method", "request_url", "request_path",
                     "status_code", "client_ip", "user_id", "detail"):
            if hasattr(record, key):
                log_entry[key] = getattr(record, key)

        return json.dumps(log_entry, ensure_ascii=False)


def setup_logging() -> None:
    """Configura logging centralizado para a aplicacao."""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_dir = os.getenv("LOG_DIR", "logs")

    os.makedirs(log_dir, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove handlers existentes para evitar duplicacao
    root_logger.handlers.clear()

    json_formatter = JSONFormatter()

    # Console handler — formato legivel para desenvolvimento
    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(log_level)
    root_logger.addHandler(console_handler)

    # Arquivo de logs gerais (rotacao diaria, 30 dias)
    app_file_handler = logging.handlers.TimedRotatingFileHandler(
        filename=os.path.join(log_dir, "app.log"),
        when="midnight",
        backupCount=30,
        encoding="utf-8",
    )
    app_file_handler.setFormatter(json_formatter)
    app_file_handler.setLevel(log_level)
    root_logger.addHandler(app_file_handler)

    # Arquivo exclusivo para erros/bugs (rotacao diaria, 90 dias)
    error_file_handler = logging.handlers.TimedRotatingFileHandler(
        filename=os.path.join(log_dir, "errors.log"),
        when="midnight",
        backupCount=90,
        encoding="utf-8",
    )
    error_file_handler.setFormatter(json_formatter)
    error_file_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_file_handler)

    # Reduz verbosidade de libs externas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
