"""
Domain entities for the Dashboard bounded context.

These are plain, framework-agnostic dataclasses describing the at-a-glance
state of the platform as understood by the admin domain. They are deliberately
decoupled from DRF and from the wire format of any downstream microservice
(Dependency Inversion): the infrastructure layer maps upstream JSON into these.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class DashboardMetrics:
    """The nine real-time counters shown at the top of the panel."""

    registered_users: int = 0
    approved_technicians: int = 0
    pending_technicians: int = 0
    active_services: int = 0
    completed_services: int = 0
    completed_payments: int = 0
    total_revenue: float = 0.0
    open_reports: int = 0
    active_conversations: int = 0


@dataclass(frozen=True, slots=True)
class ChartPoint:
    """A single (label, value) datum within a series."""

    label: str
    value: float


@dataclass(frozen=True, slots=True)
class ChartSeries:
    """A named, typed collection of points ready to be plotted by the front-end."""

    key: str          # machine name, e.g. "new_users"
    title: str        # human-readable title, e.g. "Usuarios nuevos"
    type: str         # chart hint: "line" | "bar" | "doughnut"
    points: list[ChartPoint] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class Kpi:
    """A derived business indicator (ratio, average, total)."""

    key: str
    label: str
    value: float
    unit: str = ""               # "", "%", "PEN"
    trend: float | None = None   # % change vs. the previous period, if known
