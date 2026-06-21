"""
Unit tests for the Dashboard context.

The application services depend only on the ``MetricsRepository`` port, so they
are tested against an in-memory fake — no HTTP, no Redis, no microservices.
The repository's normalization helpers are tested in isolation too.
"""
from __future__ import annotations

from django.test import SimpleTestCase

from dashboard.application.services import (
    ChartsQuery,
    GetDashboardCharts,
    GetDashboardKpis,
    GetDashboardSummary,
)
from dashboard.domain.entities import ChartPoint, ChartSeries, DashboardMetrics
from dashboard.domain.ports import MetricsRepository
from dashboard.infrastructure.repositories import _int, _points


class FakeMetricsRepository(MetricsRepository):
    def __init__(self, metrics: DashboardMetrics) -> None:
        self._metrics = metrics
        self.series_days: int | None = None

    def fetch_metrics(self) -> DashboardMetrics:
        return self._metrics

    def fetch_series(self, *, days: int) -> list[ChartSeries]:
        self.series_days = days
        return [ChartSeries(key="new_users", title="Usuarios nuevos", type="line",
                            points=[ChartPoint(label="2026-06-01", value=3)])]


_SAMPLE = DashboardMetrics(
    registered_users=200,
    approved_technicians=30,
    pending_technicians=10,
    active_services=15,
    completed_services=85,
    completed_payments=80,
    total_revenue=16000.0,
    open_reports=4,
    active_conversations=7,
)


class GetDashboardSummaryTests(SimpleTestCase):
    def test_returns_repository_metrics(self) -> None:
        result = GetDashboardSummary(FakeMetricsRepository(_SAMPLE)).execute()
        self.assertEqual(result.registered_users, 200)
        self.assertEqual(result.total_revenue, 16000.0)


class GetDashboardChartsTests(SimpleTestCase):
    def test_clamps_days_and_forwards_to_repository(self) -> None:
        repo = FakeMetricsRepository(_SAMPLE)
        GetDashboardCharts(repo).execute(ChartsQuery(days=9999))
        self.assertEqual(repo.series_days, 365)  # clamped upper bound

    def test_floor_clamp(self) -> None:
        self.assertEqual(ChartsQuery(days=0).days, 1)


class GetDashboardKpisTests(SimpleTestCase):
    def setUp(self) -> None:
        self.kpis = {
            k.key: k for k in GetDashboardKpis(FakeMetricsRepository(_SAMPLE)).execute()
        }

    def test_technician_approval_rate(self) -> None:
        # 30 approved / 40 total -> 75%
        self.assertEqual(self.kpis["technician_approval_rate"].value, 75.0)

    def test_service_completion_rate(self) -> None:
        # 85 completed / 100 total -> 85%
        self.assertEqual(self.kpis["service_completion_rate"].value, 85.0)

    def test_average_ticket(self) -> None:
        # 16000 / 80 -> 200.0
        self.assertEqual(self.kpis["average_ticket"].value, 200.0)

    def test_zero_division_is_safe(self) -> None:
        empty = GetDashboardKpis(FakeMetricsRepository(DashboardMetrics())).execute()
        self.assertTrue(all(k.value == 0.0 for k in empty))


class NormalizationHelperTests(SimpleTestCase):
    def test_int_picks_first_present_key(self) -> None:
        self.assertEqual(_int({"verified": 5}, "approved", "verified"), 5)

    def test_int_defaults_to_zero(self) -> None:
        self.assertEqual(_int({}, "approved"), 0)
        self.assertEqual(_int({"approved": "nope"}, "approved"), 0)

    def test_points_normalizes_results(self) -> None:
        payload = {"results": [{"date": "2026-06-01", "count": 3},
                               {"day": "2026-06-02", "value": 5}]}
        points = _points(payload)
        self.assertEqual(points, [
            {"label": "2026-06-01", "value": 3.0},
            {"label": "2026-06-02", "value": 5.0},
        ])

    def test_points_handles_missing(self) -> None:
        self.assertEqual(_points({}), [])
        self.assertEqual(_points({"results": "bad"}), [])
