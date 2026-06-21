"""
Gateway to the Auth Service.

The Auth Service is the single source of truth for credentials and token
issuance. This panel never stores passwords; it proxies authentication and
then *verifies* the resulting JWTs locally (simple-jwt) on each request.
"""
from __future__ import annotations

from shared.infrastructure.http.base_gateway import BaseGateway


class AuthGateway(BaseGateway):
    service_name = "auth"

    def login(self, *, email: str, password: str) -> dict:
        return self.post("/api/v1/auth/login", json={"email": email, "password": password})

    def refresh(self, *, refresh_token: str) -> dict:
        return self.post("/api/v1/auth/refresh", json={"refresh": refresh_token})

    def me(self) -> dict:
        return self.get("/api/v1/auth/me")

    def logout(self, *, refresh_token: str | None = None) -> None:
        body = {} if refresh_token is None else {"refresh": refresh_token}
        self.post("/api/v1/auth/logout", json=body)
