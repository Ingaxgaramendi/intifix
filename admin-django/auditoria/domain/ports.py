"""Ports for the Audit context. The application layer depends only on these."""
from __future__ import annotations

import abc
from dataclasses import dataclass
from datetime import datetime

from .entities import AuditLog


@dataclass(slots=True)
class AuditLogFilter:
    """Query criteria for reading the audit trail."""

    admin_id: str | None = None
    accion: str | None = None
    modulo: str | None = None
    entidad: str | None = None
    entidad_id: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    limit: int = 50
    skip: int = 0


class AuditLogRepository(abc.ABC):
    @abc.abstractmethod
    def save(self, log: AuditLog) -> None:
        """Persist one audit record (append-only)."""
        ...

    @abc.abstractmethod
    def query(self, criteria: AuditLogFilter) -> tuple[list[dict], int]:
        """Return (page of documents, total matching count)."""
        ...
