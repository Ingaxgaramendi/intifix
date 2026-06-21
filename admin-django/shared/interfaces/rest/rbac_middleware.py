"""
RBAC middleware.

Resolves the request's principal from the bearer JWT (validated with
simple-jwt, the same way DRF authenticates) and publishes it to the principal
context var. It establishes *identity* centrally; it does **not** authorize —
enforcement stays at each endpoint via the ``HasPermission`` permission class
and the ``@require_permission`` decorator (defense in depth / least privilege).

A missing or invalid token yields the anonymous principal; the endpoint's
permission layer then rejects the request as appropriate.
"""
from __future__ import annotations

import logging

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from shared.domain.rbac import Principal
from shared.interfaces.rest.rbac_context import clear_principal, set_principal

logger = logging.getLogger("intifix")


class RBACMiddleware:
    def __init__(self, get_response):  # noqa: ANN001
        self.get_response = get_response

    def __call__(self, request):  # noqa: ANN001
        set_principal(self._resolve(request))
        try:
            return self.get_response(request)
        finally:
            clear_principal()

    @staticmethod
    def _resolve(request) -> Principal:  # noqa: ANN001
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith("Bearer "):
            return Principal()
        raw = header[7:].strip()
        try:
            token = AccessToken(raw)
        except TokenError:
            return Principal()
        except Exception:  # noqa: BLE001 - never let auth parsing break the request
            logger.exception("unexpected error decoding bearer token for RBAC")
            return Principal()

        roles = token.get("roles", []) or []
        if not isinstance(roles, (list, tuple)):
            roles = [roles]
        return Principal.build(admin_id=_stringify(token.get("sub")), roles=roles)


def _stringify(value) -> str | None:  # noqa: ANN001
    return str(value) if value is not None else None
