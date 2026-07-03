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

from shared.domain.exceptions import GatewayError
from shared.infrastructure.cache.redis_cache import build_key, get_or_set
from shared.infrastructure.http.base_gateway import BaseGateway

from ..domain.entities import ChartPoint, ChartSeries, DashboardMetrics
from ..domain.ports import MetricsRepository


class _ServiceClient(BaseGateway):
    """Generic gateway to any backend module (all share the :8080 host).

    Lets the dashboard call arbitrary count/list paths without going through the
    repository gateways, whose ``get(id)`` overrides shadow ``BaseGateway.get``.
    """

    def __init__(self, service_name: str, *, bearer_token: str | None = None) -> None:
        self.service_name = service_name  # set before BaseGateway reads it
        super().__init__(bearer_token=bearer_token)

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
        # Each call is isolated (graceful degradation → 0 on failure).
        # Payments resumen is fetched once and used for both payment counters.
        resumen = self._fetch("payments", "/api/v1/payments/resumen")
        return {
            "registered_users": self._count(self._fetch(
                "users", "/api/v1/clientes/total")),
            "approved_technicians": self._count(self._fetch(
                "technicians", "/api/v1/technicians/total/aprobados")),
            "pending_technicians": self._count(self._fetch(
                "technicians", "/api/v1/technicians/buscar/estado",
                params={"estado": "PENDIENTE", "page": 0, "size": 1})),
            "active_services": self._count(self._fetch(
                "services", "/api/v1/services/estado/EN_PROCESO/count")),
            "completed_services": self._count(self._fetch(
                "services", "/api/v1/services/estado/FINALIZADO/count")),
            "open_reports": self._count(self._fetch(
                "services", "/api/v1/services/reportes/estado/PENDIENTE/count")),
            "active_conversations": self._count(self._fetch(
                "chat", "/api/v1/chat/conversaciones", params={"page": 0, "size": 1})),
            "completed_payments": _int(resumen, "pagosPagados") if isinstance(resumen, dict) else 0,
            "total_revenue": _float_val(resumen, "montoTotalProcesado") if isinstance(resumen, dict) else 0.0,
        }

    def _collect_series(self, days: int) -> list[dict[str, Any]]:
        # Build bar charts from current platform state (no time-series endpoints available).
        # Payments: distribution by state from /payments/resumen.
        resumen = self._fetch("payments", "/api/v1/payments/resumen")
        payment_points: list[dict[str, Any]] = []
        if isinstance(resumen, dict):
            conteo = resumen.get("conteoPorEstado") or {}
            label_map = {
                "PENDIENTE": "Pendiente", "PAGADO": "Pagado",
                "REEMBOLSADO": "Reembolsado", "FALLIDO": "Fallido",
            }
            if isinstance(conteo, dict):
                payment_points = [
                    {"label": label_map.get(k, k), "value": int(v or 0)}
                    for k, v in conteo.items()
                ]

        # Services: count per key state.
        _svc_states = [
            ("PENDIENTE", "Pendiente"), ("COTIZANDO", "Cotizando"),
            ("ASIGNADO", "Asignado"), ("EN_PROCESO", "En proceso"),
            ("FINALIZADO", "Finalizado"), ("CANCELADO", "Cancelado"),
        ]
        service_points: list[dict[str, Any]] = []
        for estado, label in _svc_states:
            cnt = self._count(self._fetch(
                "services", f"/api/v1/services/estado/{estado}/count"
            ))
            service_points.append({"label": label, "value": cnt})

        return [
            {
                "key": "payment_states",
                "title": "Distribución de pagos",
                "type": "bar",
                "points": payment_points,
            },
            {
                "key": "service_states",
                "title": "Servicios por estado",
                "type": "bar",
                "points": service_points,
            },
        ]

    def _fetch(self, service: str, path: str, *, params: dict | None = None) -> Any:
        return self._safe(
            lambda: _ServiceClient(service, bearer_token=self._token).get(path, params=params)
        )

    @staticmethod
    def _count(payload: Any) -> int:
        """Read a count from a bare number, or from a normalized Page dict."""
        if isinstance(payload, bool):
            return 0
        if isinstance(payload, (int, float)):
            return int(payload)
        if isinstance(payload, dict):
            return _int(payload, "count", "total", "totalElements")
        return 0

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


def _float_val(data: dict, *keys: str) -> float:
    """Read a float from the first present key in ``data``."""
    value = _first(data, *keys)
    try:
        return float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


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
