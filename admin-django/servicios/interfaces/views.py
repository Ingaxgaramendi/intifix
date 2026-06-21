"""REST controllers for the Services context."""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.interfaces.rest.permissions import IsAdmin
from shared.interfaces.rest.utils import bearer_token

from ..infrastructure.services_gateway import ServicesGateway


class ServiceListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request: Request) -> Response:
        gateway = ServicesGateway(bearer_token=bearer_token(request))
        return Response(gateway.list_services(params=request.query_params.dict()))


class ServiceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request: Request, service_id: str) -> Response:
        gateway = ServicesGateway(bearer_token=bearer_token(request))
        return Response(gateway.get_service(service_id))
