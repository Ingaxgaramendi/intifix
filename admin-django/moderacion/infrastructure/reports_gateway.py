"""
HTTP gateway to the Services Service for reports — concrete ``ReportRepository``
(Anti-Corruption Layer).

Spring Boot endpoint contract (``/api/v1/services/reportes``):
  GET  /pendientes              → pending reports (admin-only, Pageable)
  GET  /estado/{ESTADO}         → by status: PENDIENTE | EN_REVISION | RESUELTO (Pageable)
  GET  /{idReporte}             → single report
  PUT  /{idReporte}/resolver    → resolve: ?resolucion=X&accionTomada=X (query params, not body)

Spring field names: idReporte, motivo, descripcionDetallada, estado (uppercase enum),
                    idReportado, idServicio, idReportante, fechaReporte
"""
from __future__ import annotations

from datetime import datetime

from servicios.infrastructure.services_gateway import ServicesGateway
from shared.domain.entities import Page

from ..domain.entities import Report, ReportStatus
from ..domain.ports import ReportRepository

# Django lowercase ↔ Spring UPPERCASE (mirrors EstadoReporte enum in intifix-2026)
_TO_SPRING: dict[str, str] = {
    "pendiente": "PENDIENTE",
    "en_revision": "EN_REVISION",
    "resuelto": "RESUELTO",
}
_FROM_SPRING: dict[str, str] = {v: k for k, v in _TO_SPRING.items()}


class ReportsGateway(ServicesGateway, ReportRepository):
    """Reuses the Services Service connection (``service_name = "services"``)."""

    def list(
        self, *, page: int, page_size: int, status: str | None = None,
        search: str | None = None,
    ) -> Page[Report]:
        params: dict = {"page": page - 1 if page > 0 else 0, "size": page_size}

        if status:
            spring_status = _TO_SPRING.get(status, status.upper())
            path = f"/api/v1/services/reportes/estado/{spring_status}"
        else:
            # No generic list endpoint — /pendientes is the admin entry point.
            path = "/api/v1/services/reportes/pendientes"

        payload = super().get(path, params=params) or {}
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
        # Spring uses PUT /{id}/resolver with @RequestParam (not PATCH + JSON body).
        spring_status = _TO_SPRING.get(status, status.upper())
        payload = self._request(
            "PUT",
            f"/api/v1/services/reportes/{report_id}/resolver",
            params={"resolucion": spring_status, "accionTomada": spring_status},
        )
        return self._to_entity(payload or {})

    # -- Mapping (Anti-Corruption) -------------------------------------------
    @staticmethod
    def _to_entity(row: dict) -> Report:
        created = row.get("fechaReporte") or row.get("created_at")
        raw_status = str(row.get("estado") or row.get("status") or "").upper()
        normalized = _FROM_SPRING.get(raw_status, raw_status.lower())
        try:
            status_enum = ReportStatus(normalized)
        except ValueError:
            status_enum = ReportStatus.PENDIENTE
        return Report(
            id=str(row.get("idReporte") or row.get("id", "")),
            reason=(
                row.get("motivo")
                or row.get("reason")
                or row.get("tipoReporte", "")
            ),
            status=status_enum,
            reported_user_id=_str_or_none(
                row.get("idReportado") or row.get("reported_user_id")
            ),
            service_id=_str_or_none(
                row.get("idServicio") or row.get("service_id")
            ),
            reporter_id=_str_or_none(
                row.get("idReportante") or row.get("reporter_id")
            ),
            description=row.get("descripcionDetallada") or row.get("description", ""),
            created_at=_parse_dt(created),
        )


def _str_or_none(value) -> str | None:  # noqa: ANN001
    return str(value) if value is not None else None


def _parse_dt(value) -> datetime | None:  # noqa: ANN001
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
