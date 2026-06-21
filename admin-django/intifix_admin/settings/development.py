"""Development settings: convenient and verbose, never for production use."""
from __future__ import annotations

from .base import *  # noqa: F403
from .base import REST_FRAMEWORK, env

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Relax throttling locally.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {"user": "100000/hour", "anon": "10000/hour"},
}

# Browsable API helps while developing against the gateways.
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# Email to console.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Allow overriding the local DB with a plain sqlite for zero-setup runs.
if env.bool("USE_SQLITE", default=False):
    DATABASES["default"] = {  # noqa: F405
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
