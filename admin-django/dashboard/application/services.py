"""
Application services (use cases) for the Dashboard context.

Each service orchestrates the domain through the ``MetricsRepository`` port.
They are pure orchestration / computation — no HTTP, no DRF, no ORM — which
makes them trivially unit-testable with a fake repository.

``GetDashboardKpis`` additionally *derives* business indicators (ratios,
averages) from the raw counters; this calculation is domain logic and therefore
lives here in the application layer, not in a view.
"""
from __future__ import annotations

from dataclasses import dataclass

from ..domain.entities import ChartSeries, DashboardMetrics, Kpi
from ..domain.ports import MetricsRepository


@dataclass(slots=True)
class ChartsQuery:
    """Input for the charts use case (the rolling window to plot)."""

    days: int = 30

    def __post_init__(self) -> None:
        # Clamp to a sane range so a malicious/buggy caller can't ask upstream
        # services for an unbounded window.
        self.days = max(1, min(self.days, 365))


class GetDashboardSummary:
    """Return the nine real-time counters."""

    def __init__(self, repository: MetricsRepository) -> None:
        self._repository = repository

    def execute(self) -> DashboardMetrics:
        return self._repository.fetch_metrics()


class GetDashboardCharts:
    """Return the time series for the dashboard charts."""

    def __init__(self, repository: MetricsRepository) -> None:
        self._repository = repository

    def execute(self, query: ChartsQuery) -> list[ChartSeries]:
        return self._repository.fetch_series(days=query.days)


class GetDashboardKpis:
    """Derive business KPIs from the raw metrics (pure computation)."""

    def __init__(self, repository: MetricsRepository) -> None:
        self._repository = repository

    def execute(self) -> list[Kpi]:
        m = self._repository.fetch_metrics()
        total_technicians = m.approved_technicians + m.pending_technicians
        total_services = m.active_services + m.completed_services
        return [
            Kpi(
                key="technician_approval_rate",
                label="Tasa de aprobación de técnicos",
                value=_pct(m.approved_technicians, total_technicians),
                unit="%",
            ),
            Kpi(
                key="service_completion_rate",
                label="Tasa de finalización de servicios",
                value=_pct(m.completed_services, total_services),
                unit="%",
            ),
            Kpi(
                key="average_ticket",
                label="Ticket promedio",
                value=_safe_div(m.total_revenue, m.completed_payments),
                unit="PEN",
            ),
            Kpi(
                key="revenue_per_user",
                label="Ingreso por usuario registrado",
                value=_safe_div(m.total_revenue, m.registered_users),
                unit="PEN",
            ),
            Kpi(
                key="total_revenue",
                label="Ingresos totales",
                value=round(m.total_revenue, 2),
                unit="PEN",
            ),
            Kpi(
                key="open_reports",
                label="Reportes abiertos",
                value=float(m.open_reports),
            ),
            Kpi(
                key="active_conversations",
                label="Conversaciones activas",
                value=float(m.active_conversations),
            ),
        ]


# -- Pure helpers ------------------------------------------------------------
def _safe_div(numerator: float, denominator: float) -> float:
    if not denominator:
        return 0.0
    return round(numerator / denominator, 2)


def _pct(part: float, whole: float) -> float:
    if not whole:
        return 0.0
    return round(part / whole * 100, 2)
