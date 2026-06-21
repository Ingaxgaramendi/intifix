"""
``@audit_action`` decorator for DRF view handlers.

Applied to an ``APIView`` method, it records an explicit, richly-tagged audit
log after the handler returns a success response (2xx). It resolves the admin
id from the authenticated request, the entity id from the URL kwargs, and the
transport context (ip / user_agent / request id) from the audit ContextVar.

Example::

    class ApproveTechnicianView(APIView):
        @audit_action(AuditAction.APPROVE, modulo="technicians", entidad="technician")
        def patch(self, request, technician_id):
            ...
"""
from __future__ import annotations

from functools import wraps

from auditoria.application.services import record_event
from auditoria.domain.entities import AuditAction
from auditoria.infrastructure.context import set_actor


def resolve_admin_id(request) -> str | None:  # noqa: ANN001
    """Prefer the verified JWT ``user_id`` claim, fall back to request.user."""
    token = getattr(request, "auth", None)
    if token is not None and hasattr(token, "get"):
        claim = token.get("user_id")
        if claim:
            return str(claim)
    user = getattr(request, "user", None)
    user_id = getattr(user, "id", None)
    return str(user_id) if user_id else None


def _entity_id(kwargs: dict, id_kwarg: str | None) -> str | None:
    if id_kwarg:
        value = kwargs.get(id_kwarg)
        return str(value) if value is not None else None
    for key, value in kwargs.items():
        if key.endswith("_id") and value is not None:
            return str(value)
    return None


def audit_action(
    accion: str | AuditAction,
    *,
    modulo: str,
    entidad: str | None = None,
    id_kwarg: str | None = None,
):
    """Decorate an APIView handler to auto-register the action on success."""

    def decorator(func):  # noqa: ANN001
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):  # noqa: ANN001
            response = func(self, request, *args, **kwargs)
            if 200 <= getattr(response, "status_code", 500) < 400:
                admin_id = resolve_admin_id(request)
                set_actor(admin_id)
                record_event(
                    admin_id=admin_id,
                    accion=accion,
                    modulo=modulo,
                    entidad=entidad,
                    entidad_id=_entity_id(kwargs, id_kwarg),
                )
                request._audit_recorded = True
            return response

        return wrapper

    return decorator
