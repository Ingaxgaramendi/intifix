"""REST controller exposing the ``audit_logs`` trail (read-only, admin-only)."""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.domain.rbac import Permission
from shared.interfaces.rest.permissions import HasPermission

from ..application.services import AuditService
from ..domain.ports import AuditLogFilter
from ..infrastructure.mongo_repository import MongoAuditLogRepository
from .serializers import AuditLogQuerySerializer, AuditLogSerializer


class AuditLogListView(APIView):
    """GET /api/admin/audit — filter by admin, action, module, entity, date range."""

    permission_classes = [IsAuthenticated, HasPermission.of(Permission.AUDIT_VIEW)]

    def get(self, request: Request) -> Response:
        params = AuditLogQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        data = params.validated_data

        criteria = AuditLogFilter(
            admin_id=data.get("admin_id") or None,
            accion=data.get("accion") or None,
            modulo=data.get("modulo") or None,
            entidad=data.get("entidad") or None,
            entidad_id=data.get("entidad_id") or None,
            date_from=data.get("date_from"),
            date_to=data.get("date_to"),
            limit=data["limit"],
            skip=data["skip"],
        )
        service = AuditService(MongoAuditLogRepository())
        results, total = service.query(criteria)
        return Response(
            {
                "count": total,
                "limit": criteria.limit,
                "skip": criteria.skip,
                "results": AuditLogSerializer(results, many=True).data,
            }
        )
