"""Anti-Corruption Layer gateway to the Geo Service (coverage areas & live demand)."""
from __future__ import annotations

from shared.infrastructure.http.base_gateway import BaseGateway


class GeoGateway(BaseGateway):
    service_name = "geo"

    def coverage_areas(self, *, params: dict | None = None):
        return self.get("/api/v1/coverage-areas", params=params)

    def heatmap(self, *, params: dict | None = None):
        return self.get("/api/v1/analytics/heatmap", params=params)
