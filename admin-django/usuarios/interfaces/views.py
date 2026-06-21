"""
REST controllers for the Users admin context.

Each view is a thin adapter (composition root): it validates input, wires the
concrete gateway (HTTP adapter) + use case, runs it, and serializes the result.
No business logic lives here — transition rules live in the domain/application
layers.
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

from ..application.dtos import ListUsersQuery
from ..application.use_cases import (
    ActivateUser,
    BanUser,
    GetUser,
    ListUsers,
    SuspendUser,
)
from ..infrastructure.users_gateway import UsersGateway
from .serializers import (
    StatusActionSerializer,
    UserListQuerySerializer,
    UserSerializer,
)

def _actor_id(request: Request) -> str:
    return str(getattr(request.user, "id", "unknown"))


def _reason(request: Request) -> str | None:
    serializer = StatusActionSerializer(data=request.data or {})
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data.get("reason") or None


class UserListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_VIEW)]

    def get(self, request: Request) -> Response:
        params = UserListQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        data = params.validated_data

        gateway = UsersGateway(bearer_token=bearer_token(request))
        query = ListUsersQuery(
            page=data["page"],
            page_size=data["page_size"],
            search=data.get("search") or None,
            status=data.get("status") or None,
            role=data.get("role") or None,
        )
        page = ListUsers(gateway).execute(query)
        return Response(
            {
                "count": page.count,
                "page": page.page,
                "num_pages": page.num_pages,
                "results": UserSerializer([asdict(u) for u in page.results], many=True).data,
            }
        )


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_VIEW)]

    def get(self, request: Request, user_id: str) -> Response:
        gateway = UsersGateway(bearer_token=bearer_token(request))
        user = GetUser(gateway).execute(user_id)
        return Response(UserSerializer(asdict(user)).data)


class _StatusActionView(APIView):
    """Base for the suspend / activate / ban action endpoints.

    The action is auto-registered into ``audit_logs`` by the ``@audit_action``
    decorator on each concrete handler (so the use case is wired without a
    separate audit repository — no double auditing).
    """

    use_case_cls: type  # set by subclasses

    def _run(self, request: Request, user_id: str) -> Response:
        gateway = UsersGateway(bearer_token=bearer_token(request))
        use_case = self.use_case_cls(gateway)
        user = use_case.execute(
            user_id=user_id,
            actor_id=_actor_id(request),
            reason=_reason(request),
        )
        return Response(UserSerializer(asdict(user)).data)


class SuspendUserView(_StatusActionView):
    use_case_cls = SuspendUser
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_SUSPEND)]

    @audit_action(AuditAction.STATUS_CHANGE, modulo="users", entidad="user")
    def patch(self, request: Request, user_id: str) -> Response:
        return self._run(request, user_id)


class ActivateUserView(_StatusActionView):
    use_case_cls = ActivateUser
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_ACTIVATE)]

    @audit_action(AuditAction.STATUS_CHANGE, modulo="users", entidad="user")
    def patch(self, request: Request, user_id: str) -> Response:
        return self._run(request, user_id)


class BanUserView(_StatusActionView):
    use_case_cls = BanUser
    permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_BAN)]

    @audit_action(AuditAction.BLOCK, modulo="users", entidad="user")
    def patch(self, request: Request, user_id: str) -> Response:
        return self._run(request, user_id)
