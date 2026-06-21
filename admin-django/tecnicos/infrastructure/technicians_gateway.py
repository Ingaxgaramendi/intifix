"""
HTTP gateway to the Technicians Service — concrete implementation of the
``TechnicianRepository`` port (Anti-Corruption Layer).

It is the only place that knows the wire format of the Technicians Service; it
maps upstream JSON into domain entities so nothing downstream is coupled to that
contract. Django owns none of this data — it lives in the Spring Boot service.
"""
from __future__ import annotations

from datetime import datetime

from shared.domain.entities import Page
from shared.infrastructure.http.base_gateway import BaseGateway

from ..domain.entities import (
    DocumentType,
    Technician,
    TechnicianDocument,
    TechnicianStatus,
)
from ..domain.ports import TechnicianRepository


class TechniciansGateway(BaseGateway, TechnicianRepository):
    service_name = "technicians"

    def list(
        self, *, page: int, page_size: int, search: str | None = None,
        status: str | None = None,
    ) -> Page[Technician]:
        params: dict = {"page": page, "page_size": page_size}
        if search:
            params["search"] = search
        if status:
            params["status"] = status

        payload = self.get("/api/v1/technicians", params=params) or {}
        items = [self._to_entity(row) for row in payload.get("results", [])]
        return Page(
            items=items,
            total=payload.get("count", len(items)),
            page=page,
            page_size=page_size,
        )

    def get(self, technician_id: str) -> Technician:  # type: ignore[override]
        payload = super().get(f"/api/v1/technicians/{technician_id}")
        return self._to_entity(payload)

    def set_status(self, technician_id: str, status: str) -> Technician:
        payload = self.patch(
            f"/api/v1/technicians/{technician_id}/status",
            json={"status": status},
        )
        return self._to_entity(payload)

    def list_documents(self, technician_id: str) -> list[TechnicianDocument]:
        payload = self.get(f"/api/v1/technicians/{technician_id}/documents") or {}
        rows = payload.get("results", payload) if isinstance(payload, dict) else payload
        if not isinstance(rows, list):
            return []
        return [self._to_document(row) for row in rows if isinstance(row, dict)]

    # -- Mapping -------------------------------------------------------------
    @staticmethod
    def _to_entity(row: dict) -> Technician:
        created = row.get("created_at")
        return Technician(
            id=str(row["id"]),
            full_name=row.get("full_name") or row.get("name", ""),
            email=row.get("email", ""),
            status=_coerce(TechnicianStatus, row.get("status"), TechnicianStatus.PENDING),
            specialties=tuple(row.get("specialties") or ()),
            phone=row.get("phone"),
            rating=row.get("rating"),
            documents_complete=bool(row.get("documents_complete", False)),
            created_at=datetime.fromisoformat(created) if created else None,
        )

    @staticmethod
    def _to_document(row: dict) -> TechnicianDocument:
        uploaded = row.get("uploaded_at")
        return TechnicianDocument(
            type=_coerce(DocumentType, row.get("type"), DocumentType.CERTIFICATE),
            url=row.get("url", ""),
            verified=bool(row.get("verified", False)),
            uploaded_at=datetime.fromisoformat(uploaded) if uploaded else None,
        )


def _coerce(enum_cls, value, default):  # noqa: ANN001
    """Map an upstream string into our enum, tolerating unknown values."""
    try:
        return enum_cls(value)
    except ValueError:
        return default
