"""
REST controllers for the Moderation center.

Thin adapters (composition roots): validate input, wire the concrete gateways /
stores + use case, run it, serialize the result. Business rules (status flow)
live in the domain/application layers; access control is enforced by granular
``HasPermission`` permission classes (RBAC, least privilege).

History and audit are wired best-effort (a Mongo outage must not block a
moderation action that already succeeded upstream). The internal-comment store
is the system of record for comments, so it is wired directly.
"""
from __future__ import annotations

import logging
from dataclasses import asdict

from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from auditoria.domain.entities import AuditAction
from auditoria.interfaces.decorators import audit_action
from shared.domain.rbac import Permission
from shared.interfaces.rest.permissions import HasPermission
from shared.interfaces.rest.rbac_decorators import require_permission
from shared.interfaces.rest.utils import bearer_token

from ..application.dtos import ListReportsQuery
from ..application.use_cases import (
    AddInternalComment,
    BlockUser,
    GetReport,
    GetReportHistory,
    ListInternalComments,
    ListReports,
    ResolveReport,
    ReviewReport,
    UnblockUser,
)
from ..infrastructure.apelaciones_gateway import ApelacionesGateway
from ..infrastructure.mongo_stores import MongoCommentStore, MongoHistoryStore
from ..infrastructure.reports_gateway import ReportsGateway
from ..infrastructure.users_block_gateway import UsersBlockGateway
from .serializers import (
    AddCommentSerializer,
    BlockUserSerializer,
    CommentSerializer,
    HistoryEntrySerializer,
    ReportActionSerializer,
    ReportListQuerySerializer,
    ReportSerializer,
    UnblockUserSerializer,
)

logger = logging.getLogger("intifix")


def _safe(builder):  # noqa: ANN001
    """Instantiate an optional dependency, degrading to None on failure."""
    try:
        return builder()
    except Exception:  # noqa: BLE001 - best-effort dependency, never blocks the request
        logger.warning("optional moderation dependency unavailable")
        return None


def _actor_id(request: Request) -> str:
    return str(getattr(request.user, "id", "unknown"))


class ReportListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_VIEW)]

    def get(self, request: Request) -> Response:
        params = ReportListQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        data = params.validated_data

        gateway = ReportsGateway(bearer_token=bearer_token(request))
        query = ListReportsQuery(
            page=data["page"],
            page_size=data["page_size"],
            status=data.get("status") or None,
            search=data.get("search") or None,
        )
        page = ListReports(gateway).execute(query)
        return Response(
            {
                "count": page.count,
                "page": page.page,
                "num_pages": page.num_pages,
                "results": ReportSerializer([asdict(r) for r in page.results], many=True).data,
            }
        )


class ReportDetailView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_VIEW)]

    def get(self, request: Request, report_id: str) -> Response:
        gateway = ReportsGateway(bearer_token=bearer_token(request))
        report = GetReport(gateway).execute(report_id)
        return Response(ReportSerializer(asdict(report)).data)


class _ReportTransitionView(APIView):
    """Base for review / resolve actions.

    The moderation *history* (panel timeline) is written by the use case; the
    global *audit log* is written by the ``@audit_action`` decorator — no double
    audit, both views of the action preserved.
    """

    use_case_cls: type

    def _run(self, request: Request, report_id: str) -> Response:
        body = ReportActionSerializer(data=request.data or {})
        body.is_valid(raise_exception=True)

        gateway = ReportsGateway(bearer_token=bearer_token(request))
        use_case = self.use_case_cls(gateway, _safe(MongoHistoryStore))
        report = use_case.execute(
            report_id=report_id,
            actor_id=_actor_id(request),
            note=body.validated_data.get("note") or None,
        )
        return Response(ReportSerializer(asdict(report)).data)


class ReviewReportView(_ReportTransitionView):
    use_case_cls = ReviewReport
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_REVIEW)]

    @audit_action(AuditAction.STATUS_CHANGE, modulo="moderation", entidad="report")
    def patch(self, request: Request, report_id: str) -> Response:
        return self._run(request, report_id)


class ResolveReportView(_ReportTransitionView):
    use_case_cls = ResolveReport
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_RESOLVE)]

    @audit_action(AuditAction.STATUS_CHANGE, modulo="moderation", entidad="report")
    def patch(self, request: Request, report_id: str) -> Response:
        return self._run(request, report_id)


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_VIEW)]

    def get(self, request: Request, report_id: str) -> Response:
        history = GetReportHistory(MongoHistoryStore()).execute(report_id)
        data = HistoryEntrySerializer([asdict(e) for e in history], many=True).data
        return Response({"report_id": report_id, "history": data})


class ReportCommentsView(APIView):
    """List (GET) and add (POST) moderator-only internal comments on a report.

    Viewing needs ``reports.view`` (the class-level gate); adding a comment needs
    the stricter ``reports.comment`` (enforced per-verb by ``@require_permission``).
    """

    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_VIEW)]

    def get(self, request: Request, report_id: str) -> Response:
        comments = ListInternalComments(MongoCommentStore()).execute(report_id)
        data = CommentSerializer([asdict(c) for c in comments], many=True).data
        return Response({"report_id": report_id, "comments": data})

    @require_permission(Permission.REPORTS_COMMENT)
    @audit_action(AuditAction.CREATE, modulo="moderation", entidad="comment")
    def post(self, request: Request, report_id: str) -> Response:
        body = AddCommentSerializer(data=request.data)
        body.is_valid(raise_exception=True)

        use_case = AddInternalComment(MongoCommentStore(), _safe(MongoHistoryStore))
        comment = use_case.execute(
            report_id=report_id,
            author_id=_actor_id(request),
            body=body.validated_data["body"],
        )
        return Response(CommentSerializer(asdict(comment)).data,
                        status=http_status.HTTP_201_CREATED)


class BlockUserView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_BLOCK)]

    @audit_action(AuditAction.BLOCK, modulo="moderation", entidad="user")
    def patch(self, request: Request, user_id: str) -> Response:
        body = BlockUserSerializer(data=request.data or {})
        body.is_valid(raise_exception=True)

        gateway = UsersBlockGateway(bearer_token=bearer_token(request))
        use_case = BlockUser(gateway, _safe(MongoHistoryStore))
        use_case.execute(
            user_id=user_id,
            actor_id=_actor_id(request),
            report_id=body.validated_data.get("report_id") or None,
            reason=body.validated_data.get("reason") or None,
        )
        return Response({"user_id": user_id, "blocked": True})


class UnblockUserView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_UNBLOCK)]

    @audit_action(AuditAction.UNBLOCK, modulo="moderation", entidad="user")
    def patch(self, request: Request, user_id: str) -> Response:
        body = UnblockUserSerializer(data=request.data or {})
        body.is_valid(raise_exception=True)

        gateway = UsersBlockGateway(bearer_token=bearer_token(request))
        use_case = UnblockUser(gateway, _safe(MongoHistoryStore))
        use_case.execute(
            user_id=user_id,
            actor_id=_actor_id(request),
            report_id=body.validated_data.get("report_id") or None,
        )
        return Response({"user_id": user_id, "blocked": False})


# ─── Appeals (apelaciones) ────────────────────────────────────────────────────


class ApelacionListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_VIEW)]

    def get(self, request: Request) -> Response:
        estado = request.query_params.get("estado") or None
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = max(1, min(100, int(request.query_params.get("page_size", 20))))
        except (ValueError, TypeError):
            page, page_size = 1, 20

        gateway = ApelacionesGateway(bearer_token=bearer_token(request))
        data = gateway.list(estado=estado, page=page, page_size=page_size)
        return Response(data)


class ApelacionesPendientesCountView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_VIEW)]

    def get(self, request: Request) -> Response:
        gateway = ApelacionesGateway(bearer_token=bearer_token(request))
        count = gateway.pendientes_count()
        return Response({"pendientes": count})


class RevisarApelacionView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.REPORTS_RESOLVE)]

    def patch(self, request: Request, apelacion_id: str) -> Response:
        estado = (request.data.get("estado") or "").strip()
        if not estado:
            return Response({"detail": "El campo 'estado' es requerido."}, status=http_status.HTTP_400_BAD_REQUEST)
        nota_admin = request.data.get("nota_admin") or None

        gateway = ApelacionesGateway(bearer_token=bearer_token(request))
        result = gateway.revisar(apelacion_id, estado=estado, nota_admin=nota_admin)
        return Response(result)
