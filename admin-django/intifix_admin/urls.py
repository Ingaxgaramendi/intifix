"""
Root URL configuration for Intifix Admin.

All business endpoints live under /api/v1/. Authentication is proxied to the
Auth Service; everything else is verified locally via JWT and dispatched to the
relevant bounded context.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from dashboard.interfaces.views import HealthView
from shared.interfaces.rest.metrics_view import metrics_view
from shared.interfaces.rest.auth_views import (
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
)

auth_patterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
]

# Generic microservice-backed contexts, versioned under /api/v1/.
api_v1_patterns = [
    path("auth/", include((auth_patterns, "auth"))),
    path("services/", include("servicios.interfaces.urls")),
    path("support/", include("soporte.interfaces.urls")),
    path("analytics/", include("analytics.interfaces.urls")),
]

# Administrative moderation surface, mounted under /api/admin/ as per spec.
api_admin_patterns = [
    path("users/", include("usuarios.interfaces.urls")),
    path("technicians/", include("tecnicos.interfaces.urls")),
    path("moderation/", include("moderacion.interfaces.urls")),
    path("audit/", include("auditoria.interfaces.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    # Liveness probe (no auth) — used by Docker/K8s health checks.
    path("health/", HealthView.as_view(), name="health"),
    # Prometheus scrape target (no auth — internal network only).
    path("metrics", metrics_view, name="metrics"),
    # API
    path("api/v1/", include((api_v1_patterns, "api-v1"))),
    path("api/admin/", include((api_admin_patterns, "api-admin"))),
    path("api/dashboard/", include("dashboard.interfaces.urls")),
    # OpenAPI 3 schema & docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
