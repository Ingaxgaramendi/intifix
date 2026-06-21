"""
HTTP gateway to the Services Service for reports — concrete ``ReportRepository``
(Anti-Corruption Layer). Reports are business data owned by the Services Service;
the panel only reads them and drives their moderation status.
"""
from __future__ import annotations

from datetime import datetime

from servicios.infrastructure.services_gateway import ServicesGateway
from shared.domain.entities import Page

from ..domain.entities import Report, ReportStatus
from ..domain.ports import ReportRepository


class ReportsGateway(ServicesGateway, ReportRepository):
    """Reuses the Services Service connection (``service_name = "services"``)."""

    def list(
        self, *, page: int, page_size: int, status: str | None = None,
        search: str | None = None,
    ) -> Page[Report]:
        params: dict = {"page": page, "page_size": page_size}
        if status:
            params["status"] = status
        if search:
            params["search"] = search

        payload = self.get("/api/v1/services/reportes", params=params) or {}
        items = [self._to_entity(row) for row in payload.get("results", [])]
        return Page(
            items=items,
            total=payload.get("count", len(items)),
            page=page,
            page_size=page_size,
        )

    def get(self, report_id: str) -> Report:  # type: ignore[override]
        payload = super().get(f"/api/v1/services/reportes/{report_id}")
        return self._to_entity(payload)

    def set_status(self, report_id: str, status: str) -> Report:
        payload = self.patch(
            f"/api/v1/services/reportes/{report_id}/resolver",
            json={"resolucion": status, "accionTomada": status},
        )
        return self._to_entity(payload)

    # -- Mapping -------------------------------------------------------------
    @staticmethod
    def _to_entity(row: dict) -> Report:
        created = row.get("created_at")
        status = row.get("status")
        try:
            status_enum = ReportStatus(status)
        except ValueError:
            status_enum = ReportStatus.PENDIENTE
        return Report(
            id=str(row["id"]),
            reason=row.get("reason") or row.get("type", ""),
            status=status_enum,
            reported_user_id=_str_or_none(row.get("reported_user_id")),
            service_id=_str_or_none(row.get("service_id")),
            reporter_id=_str_or_none(row.get("reporter_id")),
            description=row.get("description", ""),
            created_at=datetime.fromisoformat(created) if created else None,
        )


def _str_or_none(value) -> str | None:  # noqa: ANN001
    return str(value) if value is not None else None
