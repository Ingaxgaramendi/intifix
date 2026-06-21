from django.apps import AppConfig


class SharedConfig(AppConfig):
    """Cross-cutting kernel: domain primitives, gateway infrastructure, REST glue."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "shared"
    verbose_name = "Shared Kernel"
