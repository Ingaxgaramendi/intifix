from django.urls import path

from .views import (
    DashboardChartsView,
    DashboardKpisView,
    DashboardSummaryView,
    HealthView,
)

app_name = "dashboard"

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("summary/", DashboardSummaryView.as_view(), name="summary"),
    path("charts/", DashboardChartsView.as_view(), name="charts"),
    path("kpis/", DashboardKpisView.as_view(), name="kpis"),
]
