"""REST controllers for the Analytics/Geo context."""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.interfaces.rest.permissions import IsAdmin
from shared.interfaces.rest.utils import bearer_token

from ..infrastructure.geo_gateway import GeoGateway


class CoverageAreasView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request: Request) -> Response:
        gateway = GeoGateway(bearer_token=bearer_token(request))
        return Response(gateway.coverage_areas(params=request.query_params.dict()))


class DemandHeatmapView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request: Request) -> Response:
        gateway = GeoGateway(bearer_token=bearer_token(request))
        return Response(gateway.heatmap(params=request.query_params.dict()))
