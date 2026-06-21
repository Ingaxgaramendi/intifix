"""
Request correlation: assigns/propagates an ``X-Request-ID`` for every request
and exposes it to (a) the logging pipeline and (b) the outbound gateways, so a
single admin action can be traced end-to-end across microservices.
"""
from __future__ import annotations

import logging
import uuid
from contextvars import ContextVar

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)

HEADER = "X-Request-ID"


def get_request_id() -> str | None:
    return _request_id.get()


def set_request_id(value: str | None) -> None:
    _request_id.set(value)


class RequestIDMiddleware:
    """Populate the request-id context var and echo it back on the response."""

    def __init__(self, get_response):  # noqa: ANN001
        self.get_response = get_response

    def __call__(self, request):  # noqa: ANN001
        rid = request.headers.get(HEADER) or uuid.uuid4().hex
        set_request_id(rid)
        request.request_id = rid
        try:
            response = self.get_response(request)
        finally:
            response_rid = rid
        response[HEADER] = response_rid
        set_request_id(None)
        return response


class RequestIDLogFilter(logging.Filter):
    """Inject ``request_id`` into every log record so formatters can render it."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        return True
