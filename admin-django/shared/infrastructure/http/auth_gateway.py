"""
Gateway to the backend's Auth module (Anti-Corruption Layer).

The backend is the single source of truth for credentials and token issuance.
This panel never stores passwords; it proxies authentication and then verifies
the resulting JWTs locally on each request.

It maps the backend's wire contract to the panel's:
  * request bodies use the backend field names (``correo`` / ``clave`` /
    ``refreshToken``);
  * the ``ApiResponse`` envelope is already unwrapped by ``BaseGateway``;
  * the backend returns ``accessToken`` / ``refreshToken`` (camelCase), which we
    expose downstream as ``access`` / ``refresh`` so the admin views and the SPA
    keep their existing shape.
"""
from __future__ import annotations

from typing import Any

from shared.infrastructure.http.base_gateway import BaseGateway


class AuthGateway(BaseGateway):
    service_name = "auth"

    def login(self, *, email: str, password: str) -> dict:
        payload = self.post("/api/v1/auth/login", json={"correo": email, "clave": password})
        return _map_tokens(payload)

    def refresh(self, *, refresh_token: str) -> dict:
        payload = self.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})
        return _map_tokens(payload)

    def me(self) -> dict:
        return self.get("/api/v1/auth/current-user")

    def logout(self, *, refresh_token: str | None = None) -> None:
        body = {} if refresh_token is None else {"refreshToken": refresh_token}
        self.post("/api/v1/auth/logout", json=body)


def _map_tokens(payload: Any) -> dict:
    """Map the backend ``accessToken``/``refreshToken`` to ``access``/``refresh``."""
    if not isinstance(payload, dict):
        return {}
    mapped = dict(payload)
    if "accessToken" in payload:
        mapped["access"] = payload["accessToken"]
    if "refreshToken" in payload:
        mapped["refresh"] = payload["refreshToken"]
    return mapped
