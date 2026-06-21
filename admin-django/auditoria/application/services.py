"""
Application services for the Audit context.

``AuditService`` is the single entry point for writing and reading audit logs.
``record_event`` is a best-effort convenience wrapper used by the middleware,
the decorators and the auth views: it enriches the record with the per-request
context (ip / user_agent / request_id) and never raises — auditing must never
break the action being audited.
"""
from __future__ import annotations

import logging

from ..domain.entities import AuditAction, AuditLog
from ..domain.ports import AuditLogFilter, AuditLogRepository
from ..infrastructure.context import get_context

logger = logging.getLogger("intifix.audit")


class AuditService:
    def __init__(self, repository: AuditLogRepository) -> None:
        self._repository = repository

    def record(
        self,
        *,
        admin_id: str,
        accion: str,
        modulo: str,
        entidad: str | None = None,
        entidad_id: str | None = None,
        ip: str | None = None,
        user_agent: str | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        log = AuditLog(
            admin_id=admin_id,
            accion=accion,
            modulo=modulo,
            entidad=entidad,
            entidad_id=entidad_id,
            ip=ip,
            user_agent=user_agent,
            metadata=metadata or {},
        )
        self._repository.save(log)
        return log

    def query(self, criteria: AuditLogFilter) -> tuple[list[dict], int]:
        return self._repository.query(criteria)


def _default_repository() -> AuditLogRepository:
    # Imported lazily so importing this module never forces a Mongo connection.
    from ..infrastructure.mongo_repository import MongoAuditLogRepository

    return MongoAuditLogRepository()


def record_event(
    *,
    admin_id: str | None,
    accion: str | AuditAction,
    modulo: str,
    entidad: str | None = None,
    entidad_id: str | None = None,
    metadata: dict | None = None,
    repository: AuditLogRepository | None = None,
) -> None:
    """Enrich with request context and persist, swallowing any failure."""
    ctx = get_context()
    action_value = accion.value if isinstance(accion, AuditAction) else accion
    enriched = dict(metadata or {})
    if ctx.request_id and "request_id" not in enriched:
        enriched["request_id"] = ctx.request_id
    try:
        service = AuditService(repository or _default_repository())
        service.record(
            admin_id=admin_id or ctx.admin_id or "anonymous",
            accion=action_value,
            modulo=modulo,
            entidad=entidad,
            entidad_id=entidad_id,
            ip=ctx.ip,
            user_agent=ctx.user_agent,
            metadata=enriched,
        )
    except Exception:  # noqa: BLE001 - audit is best-effort, never blocks the action
        logger.exception("failed to write audit log accion=%s modulo=%s", action_value, modulo)
