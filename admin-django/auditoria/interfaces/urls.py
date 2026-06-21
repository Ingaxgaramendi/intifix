from django.urls import path

from .views import AuditLogListView

app_name = "auditoria"

urlpatterns = [
    path("", AuditLogListView.as_view(), name="audit-list"),
]
