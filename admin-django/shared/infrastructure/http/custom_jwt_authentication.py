"""
Custom JWT authentication that doesn't require a local user database.

The Intifix backend (intifix-2026, Spring Boot) issues HS256 JWTs with this
contract: ``sub`` = user id, ``correo`` = email, ``roles`` = list of role names,
``typ`` = "access"|"refresh". It does **not** emit simple-jwt's ``token_type`` /
``jti`` claims, so simple-jwt's ``JWTAuthentication`` would reject these tokens.

We therefore decode directly with the shared backend decoder (PyJWT) and build a
lightweight, DB-free principal from the claims — the admin panel owns no local
user table for platform accounts.

``request.auth`` is the raw claims dict (RBAC permission classes read ``roles``
from it); ``request.user`` is the ``BackendUser``.
"""
from __future__ import annotations

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from shared.infrastructure.security.jwt import decode_bearer, is_access_token


class BackendUser:
    """Minimal authenticated user reconstructed from the JWT claims (no DB)."""

    def __init__(self, *, user_id: str | None, email: str, roles: list[str]) -> None:
        self.id = user_id
        self.pk = user_id
        self.email = email
        self.roles = roles
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False

    def __str__(self) -> str:
        return self.email or self.id or "anonymous"


class ClaimsBasedJWTAuthentication(BaseAuthentication):
    """Authenticate a request from the backend's JWT claims, without a DB lookup."""

    def authenticate(self, request):  # noqa: ANN001
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None  # no credentials → let AllowAny / anonymous handle it

        claims = decode_bearer(header[7:].strip())
        if claims is None:
            raise AuthenticationFailed("Token inválido o expirado.")
        if not is_access_token(claims):
            raise AuthenticationFailed("Se requiere un access token.")

        roles = claims.get("roles", []) or []
        if not isinstance(roles, (list, tuple)):
            roles = [roles]

        user = BackendUser(
            user_id=_str(claims.get("sub")),
            email=claims.get("correo", ""),
            roles=list(roles),
        )
        return (user, claims)

    def authenticate_header(self, request):  # noqa: ANN001
        return "Bearer"


def _str(value) -> str | None:  # noqa: ANN001
    return str(value) if value is not None else None
