"""Anti-Corruption Layer gateway to the Services Service (service catalog & orders)."""
from __future__ import annotations

from shared.infrastructure.http.base_gateway import BaseGateway


class ServicesGateway(BaseGateway):
    service_name = "services"

    def list_services(self, *, params: dict | None = None):
        return self.get("/api/v1/services", params=params)

    def get_service(self, service_id: str):
        return self.get(f"/api/v1/services/{service_id}")
