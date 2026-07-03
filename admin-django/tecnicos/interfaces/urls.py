from django.urls import path

from .views import (
    ApproveTechnicianView,
    ReactivateTechnicianView,
    RejectTechnicianView,
    SuspendTechnicianView,
    TechnicianDetailView,
    TechnicianDocumentsView,
    TechnicianListView,
)

app_name = "tecnicos"

urlpatterns = [
    path("", TechnicianListView.as_view(), name="technician-list"),
    path("<str:technician_id>/", TechnicianDetailView.as_view(), name="technician-detail"),
    path(
        "<str:technician_id>/documents/",
        TechnicianDocumentsView.as_view(),
        name="technician-documents",
    ),
    path("<str:technician_id>/approve/", ApproveTechnicianView.as_view(), name="technician-approve"),
    path("<str:technician_id>/reject/", RejectTechnicianView.as_view(), name="technician-reject"),
    path("<str:technician_id>/suspend/", SuspendTechnicianView.as_view(), name="technician-suspend"),
    path("<str:technician_id>/reactivate/", ReactivateTechnicianView.as_view(), name="technician-reactivate"),
]
