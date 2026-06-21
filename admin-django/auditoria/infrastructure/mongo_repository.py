"""MongoDB-backed ``AuditLogRepository`` — writes/reads the ``audit_logs`` collection."""
from __future__ import annotations

from shared.infrastructure.mongo.client import get_collection

from ..domain.entities import AuditLog
from ..domain.ports import AuditLogFilter, AuditLogRepository

_COLLECTION = "audit_logs"


class MongoAuditLogRepository(AuditLogRepository):
    def __init__(self) -> None:
        self._collection = get_collection(_COLLECTION)

    def save(self, log: AuditLog) -> None:
        self._collection.insert_one(log.to_document())

    def query(self, criteria: AuditLogFilter) -> tuple[list[dict], int]:
        query = self._build_query(criteria)
        total = self._collection.count_documents(query)
        cursor = (
            self._collection.find(query, {"_id": False})
            .sort("fecha", -1)
            .skip(max(criteria.skip, 0))
            .limit(max(min(criteria.limit, 500), 1))
        )
        return list(cursor), total

    @staticmethod
    def _build_query(criteria: AuditLogFilter) -> dict:
        query: dict = {}
        for field_name in ("admin_id", "accion", "modulo", "entidad", "entidad_id"):
            value = getattr(criteria, field_name)
            if value:
                query[field_name] = value
        date_range: dict = {}
        if criteria.date_from:
            date_range["$gte"] = criteria.date_from
        if criteria.date_to:
            date_range["$lte"] = criteria.date_to
        if date_range:
            query["fecha"] = date_range
        return query
