"""
Centralized logging configuration.

Produces a single, consistent log pipeline for the whole project:
  - Console output (human-readable in dev, JSON-ish in prod).
  - A rotating file handler for the application logs.
  - A dedicated logger for the microservice gateways so outbound calls are
    auditable independently of the rest of the app.

`build_logging_config` returns a standard ``logging.config.dictConfig`` dict.
Pure stdlib — no third-party logging dependency required.
"""
from __future__ import annotations

from pathlib import Path


def build_logging_config(*, level: str, json_output: bool, base_dir: Path) -> dict:
    logs_dir = base_dir / "logs"
    logs_dir.mkdir(exist_ok=True)

    console_formatter = "json" if json_output else "verbose"

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": (
                    "%(asctime)s | %(levelname)-8s | %(name)s | "
                    "%(request_id)s | %(message)s"
                ),
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "()": "intifix_admin.settings.logging.JSONFormatter",
            },
        },
        "filters": {
            "request_id": {
                "()": "shared.interfaces.rest.middleware.RequestIDLogFilter",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": console_formatter,
                "filters": ["request_id"],
            },
            "app_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(logs_dir / "intifix_admin.log"),
                "maxBytes": 10 * 1024 * 1024,  # 10 MB
                "backupCount": 5,
                "formatter": console_formatter,
                "filters": ["request_id"],
                "encoding": "utf-8",
            },
            "gateway_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "filename": str(logs_dir / "gateways.log"),
                "maxBytes": 10 * 1024 * 1024,
                "backupCount": 5,
                "formatter": console_formatter,
                "filters": ["request_id"],
                "encoding": "utf-8",
            },
        },
        "root": {
            "handlers": ["console", "app_file"],
            "level": level,
        },
        "loggers": {
            "django": {
                "handlers": ["console", "app_file"],
                "level": "INFO",
                "propagate": False,
            },
            "django.request": {
                "handlers": ["console", "app_file"],
                "level": "ERROR",
                "propagate": False,
            },
            # All outbound microservice calls log here.
            "intifix.gateway": {
                "handlers": ["console", "gateway_file"],
                "level": level,
                "propagate": False,
            },
            # Application/business logging.
            "intifix": {
                "handlers": ["console", "app_file"],
                "level": level,
                "propagate": False,
            },
            # Structured HTTP access log (one line per request) — scraped by Loki.
            "intifix.access": {
                "handlers": ["console", "app_file"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }


# Standard ``LogRecord`` attributes — everything else on the record is treated
# as a structured "extra" field and included in the JSON output.
_STANDARD_ATTRS = frozenset({
    "args", "asctime", "created", "exc_info", "exc_text", "filename", "funcName",
    "levelname", "levelno", "lineno", "module", "msecs", "message", "msg", "name",
    "pathname", "process", "processName", "relativeCreated", "stack_info",
    "thread", "threadName", "taskName", "request_id",
})


class JSONFormatter:
    """Minimal dependency-free JSON log formatter."""

    def __init__(self) -> None:
        import logging

        self._logging = logging

    def format(self, record) -> str:  # noqa: ANN001
        import json

        payload = {
            "timestamp": self._logging.Formatter().formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "request_id": getattr(record, "request_id", "-"),
            "message": record.getMessage(),
        }
        # Merge structured "extra" fields (method, path, status, duration_ms, ...).
        for key, value in record.__dict__.items():
            if key not in _STANDARD_ATTRS and not key.startswith("_"):
                payload.setdefault(key, value)
        if record.exc_info:
            payload["exception"] = self._logging.Formatter().formatException(
                record.exc_info
            )
        return json.dumps(payload, ensure_ascii=False, default=str)
