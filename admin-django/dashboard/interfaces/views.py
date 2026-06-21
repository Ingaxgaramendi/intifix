"""
REST controllers for the Dashboard context.

Each view is a thin adapter (composition root): it parses input, wires the
concrete repository + application service, runs it, and serializes the result.
No business logic lives here — the counters are aggregated in the repository and
the KPIs are derived in the application layer.
"""
from __future__ import annotations

from dataclasses import asdict

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.domain.rbac import Permission
from shared.interfaces.rest.permissions import HasPermission
from shared.interfaces.rest.utils import bearer_token

from ..application.services import (
    ChartsQuery,
    GetDashboardCharts,
    GetDashboardKpis,
    GetDashboardSummary,
)
from ..infrastructure.repositories import AggregatedMetricsRepository
from .serializers import (
    ChartSeriesSerializer,
    DashboardSummarySerializer,
    KpiSerializer,
)


class HealthView(APIView):
    """Liveness probe — no auth, no upstream calls."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response({"status": "ok", "service": "intifix-admin"})


class DashboardSummaryView(APIView):
    """GET /api/v1/dashboard/summary — the nine real-time counters."""

    permission_classes = [IsAuthenticated, HasPermission.of(Permission.DASHBOARD_VIEW)]

    def get(self, request: Request) -> Response:
        repository = AggregatedMetricsRepository(bearer_token=bearer_token(request))
        metrics = GetDashboardSummary(repository).execute()
        return Response(DashboardSummarySerializer(asdict(metrics)).data)


class DashboardChartsView(APIView):
    """GET /api/v1/dashboard/charts?days=30 — time series for the charts."""

    permission_classes = [IsAuthenticated, HasPermission.of(Permission.DASHBOARD_VIEW)]

    def get(self, request: Request) -> Response:
        repository = AggregatedMetricsRepository(bearer_token=bearer_token(request))
        query = ChartsQuery(days=_int_param(request, "days", default=30))
        series = GetDashboardCharts(repository).execute(query)
        data = ChartSeriesSerializer([asdict(s) for s in series], many=True).data
        return Response({"days": query.days, "charts": data})


class DashboardKpisView(APIView):
    """GET /api/v1/dashboard/kpis — derived business indicators."""

    permission_classes = [IsAuthenticated, HasPermission.of(Permission.DASHBOARD_VIEW)]

    def get(self, request: Request) -> Response:
        repository = AggregatedMetricsRepository(bearer_token=bearer_token(request))
        kpis = GetDashboardKpis(repository).execute()
        data = KpiSerializer([asdict(k) for k in kpis], many=True).data
        return Response({"kpis": data})


def _int_param(request: Request, name: str, *, default: int) -> int:
    try:
        return int(request.query_params.get(name, default))
    except (TypeError, ValueError):
        return default
