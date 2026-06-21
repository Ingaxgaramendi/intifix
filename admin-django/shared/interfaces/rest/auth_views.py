"""
Authentication endpoints — thin proxy over the Auth Service.

Login/refresh are delegated upstream; the issued access token is then presented
on subsequent calls and verified locally by ``rest_framework_simplejwt``.
"""
from __future__ import annotations

from rest_framework import serializers
from rest_framework import status as http_status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from auditoria.application.services import record_event
from auditoria.domain.entities import AuditAction
from shared.infrastructure.http.auth_gateway import AuthGateway
from shared.interfaces.rest.utils import bearer_token


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, allow_blank=True)


def _login_admin_id(tokens: dict, fallback: str) -> str:
    """Best-effort admin id from the auth response, else the login email."""
    user = tokens.get("user") if isinstance(tokens, dict) else None
    if isinstance(user, dict) and user.get("id"):
        return str(user["id"])
    return fallback


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        tokens = AuthGateway().login(
            email=email,
            password=serializer.validated_data["password"],
        )
        # Transform Spring's camelCase to Django's snake_case
        if isinstance(tokens, dict):
            if "accessToken" in tokens:
                tokens["access"] = tokens.pop("accessToken")
            if "refreshToken" in tokens:
                tokens["refresh"] = tokens.pop("refreshToken")
        # Auto-register the successful login (ip/user_agent come from the context).
        record_event(
            admin_id=_login_admin_id(tokens, email),
            accion=AuditAction.LOGIN,
            modulo="auth",
            entidad="session",
            metadata={"email": email},
        )
        return Response(tokens)


class LogoutView(APIView):
    def post(self, request: Request) -> Response:
        serializer = LogoutSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        refresh = serializer.validated_data.get("refresh") or None

        try:
            AuthGateway(bearer_token=bearer_token(request)).logout(refresh_token=refresh)
        except Exception:  # noqa: BLE001 - upstream logout is best-effort
            pass

        record_event(
            admin_id=str(getattr(request.user, "id", "") or "unknown"),
            accion=AuditAction.LOGOUT,
            modulo="auth",
            entidad="session",
        )
        return Response(status=http_status.HTTP_205_RESET_CONTENT)


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = AuthGateway().refresh(
            refresh_token=serializer.validated_data["refresh"]
        )
        # Transform Spring's camelCase to Django's snake_case
        if isinstance(tokens, dict):
            if "accessToken" in tokens:
                tokens["access"] = tokens.pop("accessToken")
            if "refreshToken" in tokens:
                tokens["refresh"] = tokens.pop("refreshToken")
        return Response(tokens)


class MeView(APIView):
    def get(self, request: Request) -> Response:
        return Response(AuthGateway(bearer_token=bearer_token(request)).me())
