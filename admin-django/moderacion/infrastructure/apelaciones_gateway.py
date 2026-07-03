"""
Gateway to the Auth Service for user appeals (apelaciones).

Spring Boot endpoints (ApelacionController):
  GET  /api/v1/admin/apelaciones              → Page<ApelacionResponse> (estado?, page, size)
  PATCH /api/v1/admin/apelaciones/{id}/revisar → updated ApelacionResponse
  GET  /api/v1/admin/apelaciones/pendientes/count → {"pendientes": N}
"""
from __future__ import annotations

from shared.infrastructure.http.base_gateway import BaseGateway


class ApelacionesGateway(BaseGateway):
    service_name = "auth"

    def list(
        self,
        *,
        estado: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        params: dict = {"page": page - 1, "size": page_size}
        if estado:
            params["estado"] = estado.upper()
        return self.get("/api/v1/admin/apelaciones", params=params) or {}

    def revisar(
        self,
        apelacion_id: str,
        *,
        estado: str,
        nota_admin: str | None,
    ) -> dict:
        body: dict = {"estado": estado.upper()}
        if nota_admin:
            body["notaAdmin"] = nota_admin
        return self.patch(f"/api/v1/admin/apelaciones/{apelacion_id}/revisar", json=body) or {}

    def pendientes_count(self) -> int:
        data = self.get("/api/v1/admin/apelaciones/pendientes/count") or {}
        return int(data.get("pendientes", 0))
