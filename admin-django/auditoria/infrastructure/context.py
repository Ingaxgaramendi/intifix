"""
Per-request audit context.

The middleware captures the transport-level facts of a request (client IP,
user-agent, request id) once and stashes them in a ``ContextVar``. Decorators
and services then read them from anywhere in the call stack without having to
thread the HttpRequest through every layer — keeping the domain/application
code free of framework objects.
"""
from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass, replace


@dataclass(frozen=True, slots=True)
class AuditContext:
    ip: str | None = None
    user_agent: str | None = None
    request_id: str | None = None
    admin_id: str | None = None


_ctx: ContextVar[AuditContext] = ContextVar("audit_context", default=AuditContext())


def set_context(ctx: AuditContext) -> None:
    _ctx.set(ctx)


def get_context() -> AuditContext:
    return _ctx.get()


def set_actor(admin_id: str | None) -> None:
    """Attach the resolved admin id to the current context (called from views)."""
    _ctx.set(replace(_ctx.get(), admin_id=admin_id))


def clear_context() -> None:
    _ctx.set(AuditContext())
