from django.urls import path

from .views import ServiceDetailView, ServiceListView

app_name = "servicios"

urlpatterns = [
    path("", ServiceListView.as_view(), name="service-list"),
    path("<str:service_id>/", ServiceDetailView.as_view(), name="service-detail"),
]
