"""
Audit trail repository backed by MongoDB Atlas.

Every privileged admin action should be recorded here for traceability. The
collection is append-only from the application's point of view.
"""
from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone

from shared.domain.entities import AuditEvent
from shared.infrastructure.mongo.client import get_collection

_COLLECTION = "audit_events"


class AuditRepository:
    def __init__(self) -> None:
        self._collection = get_collection(_COLLECTION)

    def record(self, event: AuditEvent) -> None:
        document = asdict(event)
        document["created_at"] = datetime.now(timezone.utc)
        self._collection.insert_one(document)

    def list(self, *, actor_id: str | None = None, limit: int = 100) -> list[dict]:
        query: dict = {}
        if actor_id:
            query["actor_id"] = actor_id
        cursor = (
            self._collection.find(query, {"_id": False})
            .sort("created_at", -1)
            .limit(limit)
        )
        return list(cursor)
