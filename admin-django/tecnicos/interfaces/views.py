"""
REST controllers for the Technicians moderation context.

Thin adapters (composition roots): validate input, wire the concrete gateway
(HTTP adapter) + use case, run it, serialize the result. Business rules live in
the domain/application layers; access control is enforced by granular
``HasPermission`` permission classes (RBAC, least privilege).
"""
from __future__ import annotations

from dataclasses import asdict

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from auditoria.domain.entities import AuditAction
from auditoria.interfaces.decorators import audit_action
from shared.domain.rbac import Permission
from shared.interfaces.rest.permissions import HasPermission
from shared.interfaces.rest.utils import bearer_token

from ..application.dtos import ListTechniciansQuery
from ..application.use_cases import (
    ApproveTechnician,
    GetTechnician,
    GetTechnicianDocuments,
    ListTechnicians,
    ReactivateTechnician,
    RejectTechnician,
    SuspendTechnician,
)
from ..infrastructure.technicians_gateway import TechniciansGateway
from .serializers import (
    ModerationActionSerializer,
    RejectActionSerializer,
    TechnicianDocumentSerializer,
    TechnicianListQuerySerializer,
    TechnicianSerializer,
)

def _actor_id(request: Request) -> str:
    return str(getattr(request.user, "id", "unknown"))


class TechnicianListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.TECHNICIANS_VIEW)]

    def get(self, request: Request) -> Response:
        params = TechnicianListQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        data = params.validated_data

        gateway = TechniciansGateway(bearer_token=bearer_token(request))
        query = ListTechniciansQuery(
            page=data["page"],
            page_size=data["page_size"],
            search=data.get("search") or None,
            status=data.get("status") or None,
        )
        page = ListTechnicians(gateway).execute(query)
        return Response(
            {
                "count": page.count,
                "page": page.page,
                "num_pages": page.num_pages,
                "results": TechnicianSerializer(
                    [asdict(t) for t in page.results], many=True
                ).data,
            }
        )


class TechnicianDetailView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.TECHNICIANS_VIEW)]

    def get(self, request: Request, technician_id: str) -> Response:
        gateway = TechniciansGateway(bearer_token=bearer_token(request))
        technician = GetTechnician(gateway).execute(technician_id)
        return Response(TechnicianSerializer(asdict(technician)).data)


class TechnicianDocumentsView(APIView):
    """View the technician's KYC documents (DNI front/back, background, certificates)."""

    permission_classes = [
        IsAuthenticated,
        HasPermission.of(Permission.TECHNICIANS_DOCUMENTS_VIEW),
    ]

    def get(self, request: Request, technician_id: str) -> Response:
        gateway = TechniciansGateway(bearer_token=bearer_token(request))
        documents = GetTechnicianDocuments(gateway).execute(technician_id)
        data = TechnicianDocumentSerializer([asdict(d) for d in documents], many=True).data
        return Response({"technician_id": technician_id, "documents": data})


class _ModerationActionView(APIView):
    """Base for approve / reject / suspend action endpoints.

    The action is auto-registered into ``audit_logs`` by the ``@audit_action``
    decorator on each concrete handler.
    """

    use_case_cls: type
    serializer_cls: type = ModerationActionSerializer

    def _run(self, request: Request, technician_id: str) -> Response:
        body = self.serializer_cls(data=request.data or {})
        body.is_valid(raise_exception=True)

        gateway = TechniciansGateway(bearer_token=bearer_token(request))
        use_case = self.use_case_cls(gateway)
        technician = use_case.execute(
            technician_id=technician_id,
            actor_id=_actor_id(request),
            reason=body.validated_data.get("reason") or None,
        )
        return Response(TechnicianSerializer(asdict(technician)).data)


class ApproveTechnicianView(_ModerationActionView):
    use_case_cls = ApproveTechnician
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.TECHNICIANS_APPROVE)]

    @audit_action(AuditAction.APPROVE, modulo="technicians", entidad="technician")
    def patch(self, request: Request, technician_id: str) -> Response:
        return self._run(request, technician_id)


class RejectTechnicianView(_ModerationActionView):
    use_case_cls = RejectTechnician
    serializer_cls = RejectActionSerializer  # reason is mandatory
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.TECHNICIANS_REJECT)]

    @audit_action(AuditAction.REJECT, modulo="technicians", entidad="technician")
    def patch(self, request: Request, technician_id: str) -> Response:
        return self._run(request, technician_id)


class SuspendTechnicianView(_ModerationActionView):
    use_case_cls = SuspendTechnician
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.TECHNICIANS_SUSPEND)]

    @audit_action(AuditAction.STATUS_CHANGE, modulo="technicians", entidad="technician")
    def patch(self, request: Request, technician_id: str) -> Response:
        return self._run(request, technician_id)


class ReactivateTechnicianView(_ModerationActionView):
    use_case_cls = ReactivateTechnician
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.TECHNICIANS_SUSPEND)]

    @audit_action(AuditAction.STATUS_CHANGE, modulo="technicians", entidad="technician")
    def patch(self, request: Request, technician_id: str) -> Response:
        return self._run(request, technician_id)
