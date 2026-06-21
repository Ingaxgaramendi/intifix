"""
Base settings shared across all environments.

Configuration is sourced from the environment (12-factor). Environment-specific
modules (development.py / production.py) import everything from here and override
only what differs.
"""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import environ

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------
# settings/base.py -> settings -> intifix_admin -> <repo root>
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# -----------------------------------------------------------------------------
# Environment loading
# -----------------------------------------------------------------------------
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key-override-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])

# -----------------------------------------------------------------------------
# Applications
# -----------------------------------------------------------------------------
DJANGO_APPS = [
    # django-unfold must precede django.contrib.admin to override its templates.
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
]

# Bounded contexts (each is a Clean Architecture slice).
LOCAL_APPS = [
    "shared",
    "dashboard",
    "usuarios",
    "tecnicos",
    "servicios",
    "soporte",
    "analytics",
    "auditoria",
    "moderacion",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# -----------------------------------------------------------------------------
# Middleware
# -----------------------------------------------------------------------------
MIDDLEWARE = [
    # Outermost: measures total request time and exports Prometheus metrics.
    "shared.interfaces.rest.metrics_middleware.PrometheusMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "shared.interfaces.rest.middleware.RequestIDMiddleware",
    # Resolves the JWT principal (roles → permissions) into the request context.
    "shared.interfaces.rest.rbac_middleware.RBACMiddleware",
    # Must follow RequestIDMiddleware so the request id is available; captures
    # the audit context and auto-registers mutating admin actions.
    "auditoria.interfaces.middleware.AuditMiddleware",
]

ROOT_URLCONF = "intifix_admin.urls"
WSGI_APPLICATION = "intifix_admin.wsgi.application"
ASGI_APPLICATION = "intifix_admin.asgi.application"

# -----------------------------------------------------------------------------
# Templates
# -----------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# -----------------------------------------------------------------------------
# Database — PostgreSQL (local admin metadata only; business data lives in
# the downstream microservices, reached via Gateways).
# -----------------------------------------------------------------------------
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://intifix:intifix_secret@localhost:5432/intifix_admin",
    )
}
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -----------------------------------------------------------------------------
# Cache & sessions — Redis
# -----------------------------------------------------------------------------
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")
REDIS_CACHE_TTL = env.int("REDIS_CACHE_TTL", default=300)

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,  # never let a cache outage take down the panel
        },
        "KEY_PREFIX": "intifix_admin",
        "TIMEOUT": REDIS_CACHE_TTL,
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# -----------------------------------------------------------------------------
# MongoDB Atlas (audit trail & analytics documents). Accessed directly via
# pymongo from the infrastructure layer — NOT through the Django ORM.
# -----------------------------------------------------------------------------
MONGODB = {
    "URI": env("MONGODB_URI", default=""),
    "DB_NAME": env("MONGODB_DB_NAME", default="intifix_admin"),
}

# -----------------------------------------------------------------------------
# Password validation
# -----------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -----------------------------------------------------------------------------
# Internationalization
# -----------------------------------------------------------------------------
LANGUAGE_CODE = env("DJANGO_LANGUAGE_CODE", default="es")
TIME_ZONE = env("DJANGO_TIME_ZONE", default="America/Lima")
USE_I18N = True
USE_TZ = True

# -----------------------------------------------------------------------------
# Static & media
# -----------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "mediafiles"

# =============================================================================
# Django REST Framework
# =============================================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "shared.infrastructure.http.custom_jwt_authentication.ClaimsBasedJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "shared.interfaces.rest.pagination.DefaultPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "user": "1000/hour",
        "anon": "60/hour",
    },
    "EXCEPTION_HANDLER": "shared.interfaces.rest.exception_handler.api_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}

# =============================================================================
# JWT — tokens are issued by the external Auth Service. This panel VERIFIES
# them (RS256 with the Auth Service public key in production).
# =============================================================================
JWT_ALGORITHM = env("JWT_ALGORITHM", default="HS256")

SIMPLE_JWT = {
    "ALGORITHM": JWT_ALGORITHM,
    "SIGNING_KEY": env("JWT_SIGNING_KEY", default=SECRET_KEY),
    "VERIFYING_KEY": env("JWT_VERIFYING_KEY", default=""),
    "ISSUER": env("JWT_ISSUER", default="intifix-auth-service"),
    "AUDIENCE": env("JWT_AUDIENCE", default="intifix-admin"),
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=env.int("JWT_ACCESS_TOKEN_LIFETIME_MIN", default=15)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=env.int("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "sub",
    "TOKEN_TYPE_CLAIM": "token_type",
}

# =============================================================================
# OpenAPI (drf-spectacular)
# =============================================================================
SPECTACULAR_SETTINGS = {
    "TITLE": "Intifix Admin API",
    "DESCRIPTION": "Internal administrative panel orchestrating Intifix microservices.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# =============================================================================
# CORS
# =============================================================================
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# Downstream microservice gateways (Anti-Corruption Layer configuration)
# =============================================================================
GATEWAY = {
    "TIMEOUT_SECONDS": env.float("GATEWAY_TIMEOUT_SECONDS", default=10.0),
    "MAX_RETRIES": env.int("GATEWAY_MAX_RETRIES", default=3),
    "BACKOFF_FACTOR": env.float("GATEWAY_BACKOFF_FACTOR", default=0.5),
    "SERVICE_API_KEY": env("SERVICE_API_KEY", default=""),
    "SERVICES": {
        "auth": env("AUTH_SERVICE_URL", default="http://localhost:8001"),
        "users": env("USERS_SERVICE_URL", default="http://localhost:8002"),
        "technicians": env("TECHNICIANS_SERVICE_URL", default="http://localhost:8003"),
        "services": env("SERVICES_SERVICE_URL", default="http://localhost:8004"),
        "payments": env("PAYMENTS_SERVICE_URL", default="http://localhost:8005"),
        "geo": env("GEO_SERVICE_URL", default="http://localhost:8006"),
        "chat": env("CHAT_SERVICE_URL", default="http://localhost:8007"),
    },
}

# =============================================================================
# Logging (centralized) — configured in settings/logging.py
# =============================================================================
from .logging import build_logging_config  # noqa: E402

LOG_LEVEL = env("LOG_LEVEL", default="INFO")
LOG_JSON = env.bool("LOG_JSON", default=False)
LOGGING = build_logging_config(level=LOG_LEVEL, json_output=LOG_JSON, base_dir=BASE_DIR)
