"""
Audit middleware.

Responsibilities:
  1. Capture the transport context (client IP, user-agent, request id) of every
     request into the audit ``ContextVar`` so decorators/services can enrich
     records without touching the HttpRequest.
  2. Auto-register mutating requests (POST/PATCH/PUT/DELETE) that complete
     successfully and were **not** already recorded by an explicit
     ``@audit_action`` decorator — a safety net so "modificaciones" are never
     missed. The decorator always wins (richer, precise metadata).
"""
from __future__ import annotations

from auditoria.application.services import record_event
from auditoria.domain.entities import AuditAction
from auditoria.infrastructure.context import (
    AuditContext,
    clear_context,
    get_context,
    set_context,
)
from auditoria.interfaces.decorators import resolve_admin_id
from shared.interfaces.rest.middleware import get_request_id

_MUTATING = {"POST", "PATCH", "PUT", "DELETE"}
_METHOD_ACTION = {
    "POST": AuditAction.CREATE,
    "PUT": AuditAction.MODIFY,
    "PATCH": AuditAction.MODIFY,
    "DELETE": AuditAction.DELETE,
}


def _client_ip(request) -> str | None:  # noqa: ANN001
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _infer_module(path: str) -> str:
    """Best-effort module name from the URL, e.g. /api/admin/users/5/ -> 'users'."""
    parts = [p for p in path.split("/") if p]
    for marker in ("admin", "v1", "dashboard"):
        if marker in parts:
            idx = parts.index(marker)
            if idx + 1 < len(parts):
                return parts[idx + 1]
    return parts[1] if len(parts) > 1 else (parts[0] if parts else "unknown")


class AuditMiddleware:
    def __init__(self, get_response):  # noqa: ANN001
        self.get_response = get_response

    def __call__(self, request):  # noqa: ANN001
        set_context(
            AuditContext(
                ip=_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT"),
                request_id=get_request_id(),
            )
        )
        try:
            response = self.get_response(request)
            self._maybe_autolog(request, response)
            return response
        finally:
            clear_context()

    def _maybe_autolog(self, request, response) -> None:  # noqa: ANN001
        if getattr(request, "_audit_recorded", False):
            return  # an explicit decorator already logged this action
        if request.method not in _MUTATING:
            return
        if not (200 <= getattr(response, "status_code", 500) < 400):
            return
        if not request.path.startswith("/api/"):
            return

        admin_id = resolve_admin_id(request) or get_context().admin_id
        if not admin_id:
            return  # unauthenticated mutating call (e.g. failed login) — skip

        record_event(
            admin_id=admin_id,
            accion=_METHOD_ACTION.get(request.method, AuditAction.MODIFY),
            modulo=_infer_module(request.path),
            metadata={
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "auto": True,
            },
        )
