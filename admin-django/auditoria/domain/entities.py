"""Domain entities for the Audit context (admin activity log)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4


class AuditAction(str, Enum):
    """Canonical, auto-registered administrative actions."""

    LOGIN = "login"
    LOGOUT = "logout"
    APPROVE = "aprobacion"
    REJECT = "rechazo"
    BLOCK = "bloqueo"
    UNBLOCK = "desbloqueo"
    STATUS_CHANGE = "cambio_estado"
    MODIFY = "modificacion"
    CREATE = "creacion"
    DELETE = "eliminacion"


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True, slots=True)
class AuditLog:
    """An immutable record of one administrative action.

    Maps 1:1 to a document in the ``audit_logs`` MongoDB collection.
    """

    admin_id: str
    accion: str
    modulo: str
    entidad: str | None = None
    entidad_id: str | None = None
    ip: str | None = None
    user_agent: str | None = None
    metadata: dict = field(default_factory=dict)
    id: str = field(default_factory=lambda: uuid4().hex)
    fecha: datetime = field(default_factory=_now)

    def to_document(self) -> dict:
        """Serialize to the exact ``audit_logs`` document shape."""
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "accion": self.accion,
            "modulo": self.modulo,
            "entidad": self.entidad,
            "entidad_id": self.entidad_id,
            "ip": self.ip,
            "user_agent": self.user_agent,
            "metadata": self.metadata,
            "fecha": self.fecha,
        }
