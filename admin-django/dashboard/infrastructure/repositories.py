"""
Concrete ``MetricsRepository`` — the Anti-Corruption Layer of the dashboard.

It fans out to the per-context gateways (Users, Technicians, Services,
Chat/Support), each of which talks to its own microservice, and normalizes
their heterogeneous ``/stats`` payloads into the domain entities.

Note: the Payments context is not wired yet; ``completed_payments`` and
``total_revenue`` fall back to the ``DashboardMetrics`` defaults (0) until the
payments module is added.

Design notes:
  * **Graceful degradation** — each upstream call is isolated; if one service
    is down the dashboard still returns the rest (the failed counters fall back
    to 0) instead of failing the whole request.
  * **Near real-time caching** — the assembled snapshot is cached in Redis for a
    few seconds. This collapses bursts of admin refreshes into a single fan-out
    while keeping the numbers fresh. Redis is configured with
    ``IGNORE_EXCEPTIONS=True``, so a cache outage degrades gracefully.
  * Only *plain dicts* are cached (picklable, version-tolerant); the domain
    entities are rebuilt from them on the way out.
"""
from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from servicios.infrastructure.services_gateway import ServicesGateway
from shared.domain.exceptions import GatewayError
from shared.infrastructure.cache.redis_cache import build_key, get_or_set
from soporte.infrastructure.chat_gateway import ChatGateway
from tecnicos.infrastructure.technicians_gateway import TechniciansGateway
from usuarios.infrastructure.users_gateway import UsersGateway

from ..domain.entities import ChartPoint, ChartSeries, DashboardMetrics
from ..domain.ports import MetricsRepository

logger = logging.getLogger("intifix")

# Short TTL: counters must feel "real-time" but we still want to absorb refresh
# bursts. The window of staleness is bounded by this value (seconds).
_METRICS_TTL = 15
_SERIES_TTL = 60


class AggregatedMetricsRepository(MetricsRepository):
    """Aggregates platform metrics from every downstream microservice."""

    def __init__(self, *, bearer_token: str | None = None) -> None:
        self._token = bearer_token

    # -- Port implementation -------------------------------------------------
    def fetch_metrics(self) -> DashboardMetrics:
        raw = get_or_set(
            build_key("dashboard", "metrics"),
            self._collect_metrics,
            ttl=_METRICS_TTL,
        )
        return DashboardMetrics(**raw)

    def fetch_series(self, *, days: int) -> list[ChartSeries]:
        raw = get_or_set(
            build_key("dashboard", "series", days),
            lambda: self._collect_series(days),
            ttl=_SERIES_TTL,
        )
        return [
            ChartSeries(
                key=s["key"],
                title=s["title"],
                type=s["type"],
                points=[ChartPoint(label=p["label"], value=p["value"]) for p in s["points"]],
            )
            for s in raw
        ]

    # -- Collection (uncached fan-out) --------------------------------------
    def _collect_metrics(self) -> dict[str, Any]:
        # Use Spring's individual count endpoints instead of non-existent /stats endpoints
        users = self._safe(lambda: UsersGateway(bearer_token=self._token).get(
            "/api/v1/clientes/total"))
        techs_total = self._safe(lambda: TechniciansGateway(bearer_token=self._token).get(
            "/api/v1/technicians/total"))
        techs_approved = self._safe(lambda: TechniciansGateway(bearer_token=self._token).get(
            "/api/v1/technicians/total/aprobados"))
        # For pending technicians, calculate from total - approved
        techs_pending = {"total": _int(techs_total) - _int(techs_approved)} if techs_total and techs_approved else {}
        
        # Services: count by state using individual endpoints
        services_active = self._safe(lambda: ServicesGateway(bearer_token=self._token).get(
            "/api/v1/services/estado/EN_PROCESO/count"))
        services_completed = self._safe(lambda: ServicesGateway(bearer_token=self._token).get(
            "/api/v1/services/estado/FINALIZADO/count"))
        
        # Reports: count pending state
        reports_pending = self._safe(lambda: ServicesGateway(bearer_token=self._token).get(
            "/api/v1/services/reportes/estado/PENDIENTE/count"))
        
        # Chat: no dedicated stats endpoint, count from list (empty params for all)
        chat_list = self._safe(lambda: ChatGateway(bearer_token=self._token).get(
            "/api/v1/chat/conversaciones", params={"page": 0, "page_size": 1}))
        # Extract total from paginated response
        chat_total = chat_list.get("total", chat_list.get("count", 0)) if isinstance(chat_list, dict) else 0

        # ``completed_payments`` / ``total_revenue`` are intentionally omitted
        # (payments module not present yet) and default to 0 on the entity.
        return {
            "registered_users": _int(users, "data", "total"),
            "approved_technicians": _int(techs_approved, "data", "total"),
            "pending_technicians": _int(techs_pending, "total"),
            "active_services": _int(services_active, "data", "total"),
            "completed_services": _int(services_completed, "data", "total"),
            "open_reports": _int(reports_pending, "data", "total"),
            "active_conversations": chat_total if isinstance(chat_total, (int, float)) else _int({"total": chat_total}),
        }

    def _collect_series(self, days: int) -> list[dict[str, Any]]:
        # Spring doesn't have series endpoints, return empty series for now
        # TODO: Implement series by aggregating from list endpoints or add series endpoints to Spring
        return [
            {
                "key": "new_users",
                "title": "Usuarios nuevos",
                "type": "line",
                "points": [],
            },
            {
                "key": "services",
                "title": "Servicios solicitados",
                "type": "line",
                "points": [],
            },
        ]

    # -- Resilience ----------------------------------------------------------
    @staticmethod
    def _safe(call: Callable[[], Any]) -> dict[str, Any]:
        """Run an upstream call, degrading to ``{}`` instead of failing."""
        try:
            return call() or {}
        except GatewayError as exc:
            logger.warning("dashboard section unavailable: %s", exc.message)
            return {}


# -- Mapping helpers (Anti-Corruption) ---------------------------------------
def _first(data: dict, *keys: str) -> Any:
    """Return the first present, non-null value among ``keys``."""
    for key in keys:
        value = data.get(key)
        if value is not None:
            return value
    return None


def _int(data: dict, *keys: str) -> int:
    value = _first(data, *keys)
    try:
        return int(value) if value is not None else 0
    except (TypeError, ValueError):
        return 0


def _points(
    payload: dict,
    *,
    label_keys: tuple[str, ...] = ("date", "label", "day", "period"),
    value_keys: tuple[str, ...] = ("count", "value", "total"),
) -> list[dict[str, Any]]:
    """Normalize an upstream ``{"results": [...]}`` series into chart points."""
    rows = payload.get("results", payload.get("series", []))
    if not isinstance(rows, list):
        return []
    points: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        label = _first(row, *label_keys)
        value = _first(row, *value_keys)
        if label is None:
            continue
        try:
            numeric = float(value) if value is not None else 0.0
        except (TypeError, ValueError):
            numeric = 0.0
        points.append({"label": str(label), "value": numeric})
    return points
