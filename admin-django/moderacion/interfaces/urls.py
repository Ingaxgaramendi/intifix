from django.urls import path

from .views import (
    BlockUserView,
    ReportCommentsView,
    ReportDetailView,
    ReportHistoryView,
    ReportListView,
    ResolveReportView,
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
]
