from django.urls import path

from .views import CoverageAreasView, DemandHeatmapView

app_name = "analytics"

urlpatterns = [
    path("coverage-areas/", CoverageAreasView.as_view(), name="coverage-areas"),
    path("heatmap/", DemandHeatmapView.as_view(), name="heatmap"),
]
