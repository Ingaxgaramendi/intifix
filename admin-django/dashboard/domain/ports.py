"""
Ports (interfaces) for the Dashboard context.

The application layer depends only on this abstraction, never on the concrete
gateways. The aggregating repository in the infrastructure layer implements it
(Dependency Inversion Principle), so use cases stay trivially unit-testable
with a fake repository.
"""
from __future__ import annotations

import abc

from .entities import ChartSeries, DashboardMetrics


class MetricsRepository(abc.ABC):
    @abc.abstractmethod
    def fetch_metrics(self) -> DashboardMetrics:
        """Return the current snapshot of the nine platform counters."""
        ...

    @abc.abstractmethod
    def fetch_series(self, *, days: int) -> list[ChartSeries]:
        """Return the time series used to render the dashboard charts."""
        ...
