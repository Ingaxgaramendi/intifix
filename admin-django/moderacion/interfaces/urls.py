from django.urls import path

from .views import (
    ApelacionListView,
    ApelacionesPendientesCountView,
    BlockUserView,
    ReportCommentsView,
    ReportDetailView,
    ReportHistoryView,
    ReportListView,
    ResolveReportView,
    RevisarApelacionView,
    ReviewReportView,
    UnblockUserView,
)

app_name = "moderacion"

urlpatterns = [
    # Reports (Services Service)
    path("reports/", ReportListView.as_view(), name="report-list"),
    path("reports/<str:report_id>/", ReportDetailView.as_view(), name="report-detail"),
    path("reports/<str:report_id>/review/", ReviewReportView.as_view(), name="report-review"),
    path("reports/<str:report_id>/resolve/", ResolveReportView.as_view(), name="report-resolve"),
    path("reports/<str:report_id>/history/", ReportHistoryView.as_view(), name="report-history"),
    path("reports/<str:report_id>/comments/", ReportCommentsView.as_view(), name="report-comments"),
    # User moderation (Users Service)
    path("users/<str:user_id>/block/", BlockUserView.as_view(), name="user-block"),
    path("users/<str:user_id>/unblock/", UnblockUserView.as_view(), name="user-unblock"),
    # Appeals (Auth Service)
    # pendientes/count/ must come before <apelacion_id>/ to avoid wildcard capture.
    path("apelaciones/pendientes/count/", ApelacionesPendientesCountView.as_view(), name="apelacion-count"),
    path("apelaciones/", ApelacionListView.as_view(), name="apelacion-list"),
    path("apelaciones/<str:apelacion_id>/revisar/", RevisarApelacionView.as_view(), name="apelacion-revisar"),
]
