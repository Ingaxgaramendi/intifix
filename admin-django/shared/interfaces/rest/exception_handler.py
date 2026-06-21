"""
Centralized DRF exception handler.

Maps domain/gateway exceptions to a consistent JSON error envelope and ensures
nothing leaks an unhandled 500 with a stack trace to API clients. This is the
one place the framework layer knows about the domain's exception taxonomy.
"""
from __future__ import annotations

import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from shared.domain.exceptions import DomainError
from shared.interfaces.rest.middleware import get_request_id

logger = logging.getLogger("intifix")


def api_exception_handler(exc, context):  # noqa: ANN001
    # Domain/gateway errors: translate to their declared status + envelope.
    if isinstance(exc, DomainError):
        if exc.status_code >= 500:
            logger.error("domain/gateway error: %s | details=%s", exc.message, exc.details)
        return _envelope(exc.code, exc.message, exc.status_code, exc.details)

    # Fall back to DRF's handling (validation, auth, throttling, 404, ...).
    response = drf_exception_handler(exc, context)
    if response is not None:
        return _envelope(
            code=_code_for_status(response.status_code),
            message=_message_from(response.data),
            status_code=response.status_code,
            details=response.data if isinstance(response.data, dict) else {"detail": response.data},
        )

    # Truly unexpected: log and return an opaque 500.
    logger.exception("unhandled exception in API view")
    return _envelope("internal_error", "An unexpected error occurred.", 500, {})


def _envelope(code: str, message: str, status_code: int, details: dict) -> Response:
    return Response(
        {
            "error": {
                "code": code,
                "message": message,
                "details": details,
                "request_id": get_request_id(),
            }
        },
        status=status_code,
    )


def _message_from(data) -> str:  # noqa: ANN001
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        return "Request could not be processed."
    if isinstance(data, list) and data:
        return str(data[0])
    return str(data)


def _code_for_status(status_code: int) -> str:
    return {
        400: "bad_request",
        401: "unauthorized",
        403: "permission_denied",
        404: "not_found",
        405: "method_not_allowed",
        429: "throttled",
    }.get(status_code, "error")
