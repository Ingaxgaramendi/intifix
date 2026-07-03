"""Unit tests for the RBAC kernel (roles, permissions, middleware, decorators)."""
from __future__ import annotations

from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from shared.domain.exceptions import PermissionDeniedError
from shared.domain.rbac import (
    ALL_PERMISSIONS,
    Permission,
    Principal,
    Role,
    permissions_for,
)
from shared.interfaces.rest.permissions import (
    HasAnyPermission,
    HasPermission,
    IsAdmin,
    principal_has,
)
from shared.interfaces.rest.rbac_decorators import require_permission
from shared.interfaces.rest.rbac_middleware import RBACMiddleware


class _Token(dict):
    """Dict-like stand-in for a validated simple-jwt token."""


class _Req:
    def __init__(self, roles=None) -> None:  # noqa: ANN001
        self.auth = _Token(roles=list(roles)) if roles is not None else None
        self.user = None


# -- Role / permission model -------------------------------------------------
class RoleModelTests(SimpleTestCase):
    def test_super_admin_has_all_permissions(self) -> None:
        self.assertEqual(permissions_for(["super_admin"]), ALL_PERMISSIONS)

    def test_alias_superadmin_maps_to_super_admin(self) -> None:
        self.assertEqual(Role.from_claim("superadmin"), Role.SUPER_ADMIN)
        self.assertEqual(Role.from_claim("ADMIN"), Role.ADMIN)

    def test_moderador_least_privilege(self) -> None:
        perms = permissions_for(["moderador"])
        self.assertIn(Permission.USERS_SUSPEND, perms)
        self.assertIn(Permission.REPORTS_RESOLVE, perms)
        # Cannot perform the escalated/destructive or oversight actions.
        self.assertNotIn(Permission.USERS_BAN, perms)
        self.assertNotIn(Permission.PAYMENTS_REFUND, perms)
        self.assertNotIn(Permission.AUDIT_VIEW, perms)

    def test_auditor_is_read_only_plus_audit(self) -> None:
        perms = permissions_for(["auditor"])
        self.assertIn(Permission.AUDIT_VIEW, perms)
        self.assertIn(Permission.USERS_VIEW, perms)
        self.assertNotIn(Permission.USERS_SUSPEND, perms)
        self.assertNotIn(Permission.REPORTS_RESOLVE, perms)

    def test_soporte_cannot_change_state(self) -> None:
        perms = permissions_for(["soporte"])
        self.assertIn(Permission.REPORTS_VIEW, perms)
        self.assertIn(Permission.REPORTS_COMMENT, perms)
        self.assertNotIn(Permission.REPORTS_RESOLVE, perms)
        self.assertNotIn(Permission.USERS_BAN, perms)

    def test_unknown_role_grants_nothing(self) -> None:
        self.assertEqual(permissions_for(["wizard"]), frozenset())

    def test_principal_build(self) -> None:
        p = Principal.build(admin_id="a1", roles=["auditor"])
        self.assertTrue(p.is_authenticated)
        self.assertTrue(p.has(Permission.AUDIT_VIEW))
        self.assertFalse(p.has(Permission.USERS_BAN))


# -- DRF permission classes --------------------------------------------------
class HasPermissionTests(SimpleTestCase):
    def test_grants_when_role_has_permission(self) -> None:
        perm = HasPermission.of(Permission.USERS_SUSPEND)()
        self.assertTrue(perm.has_permission(_Req(["moderador"]), None))

    def test_denies_when_role_lacks_permission(self) -> None:
        perm = HasPermission.of(Permission.USERS_BAN)()
        self.assertFalse(perm.has_permission(_Req(["moderador"]), None))

    def test_super_admin_passes_anything(self) -> None:
        perm = HasPermission.of(Permission.PAYMENTS_REFUND)()
        self.assertTrue(perm.has_permission(_Req(["super_admin"]), None))

    def test_require_all_semantics(self) -> None:
        perm = HasPermission.of(Permission.USERS_BAN, Permission.USERS_VIEW)()
        self.assertFalse(perm.has_permission(_Req(["moderador"]), None))  # lacks ban
        self.assertTrue(perm.has_permission(_Req(["admin"]), None))

    def test_any_permission(self) -> None:
        perm = HasAnyPermission(Permission.USERS_BAN, Permission.USERS_VIEW)()
        self.assertTrue(perm.has_permission(_Req(["moderador"]), None))  # has view

    def test_is_admin_still_works(self) -> None:
        self.assertTrue(IsAdmin().has_permission(_Req(["admin"]), None))
        self.assertTrue(IsAdmin().has_permission(_Req(["superadmin"]), None))
        self.assertFalse(IsAdmin().has_permission(_Req(["soporte"]), None))


# -- Decorator ---------------------------------------------------------------
class RequirePermissionTests(SimpleTestCase):
    def _view(self):  # noqa: ANN001
        class V:
            @require_permission(Permission.USERS_BAN)
            def patch(self, request, **kwargs):  # noqa: ANN001
                return "ok"
        return V()

    def test_allows_when_permitted(self) -> None:
        self.assertEqual(self._view().patch(_Req(["admin"])), "ok")

    def test_blocks_when_not_permitted(self) -> None:
        with self.assertRaises(PermissionDeniedError):
            self._view().patch(_Req(["moderador"]))

    def test_principal_has_helper(self) -> None:
        self.assertTrue(principal_has(_Req(["admin"]), Permission.USERS_BAN))
        self.assertFalse(principal_has(_Req(["soporte"]), Permission.USERS_BAN))


# -- Middleware --------------------------------------------------------------
class RBACMiddlewareTests(SimpleTestCase):
    def test_resolves_principal_from_valid_token(self) -> None:
        # Patch the decoder so the test does not depend on the env's JWT keys.
        # The backend puts the user id in `sub` and roles in `roles`.
        with patch(
            "shared.interfaces.rest.rbac_middleware.decode_bearer",
            return_value={"sub": "admin-7", "roles": ["moderador"]},
        ):
            class Req:
                META = {"HTTP_AUTHORIZATION": "Bearer whatever"}

            principal = RBACMiddleware._resolve(Req())
        self.assertEqual(principal.admin_id, "admin-7")
        self.assertIn(Permission.REPORTS_RESOLVE, principal.permissions)

    def test_anonymous_without_token(self) -> None:
        class Req:
            META = {}

        principal = RBACMiddleware._resolve(Req())
        self.assertFalse(principal.is_authenticated)

    def test_anonymous_with_garbage_token(self) -> None:
        class Req:
            META = {"HTTP_AUTHORIZATION": "Bearer not-a-jwt"}

        self.assertFalse(RBACMiddleware._resolve(Req()).is_authenticated)


# -- Backend JWT authentication (Spring contract) ----------------------------
_TEST_SECRET = "test-hs256-secret-at-least-32-bytes-long!"


@override_settings(SIMPLE_JWT={"SIGNING_KEY": _TEST_SECRET, "ALGORITHM": "HS256"})
class BackendJWTAuthenticationTests(SimpleTestCase):
    def _encode(self, **claims) -> str:
        import jwt

        return jwt.encode(claims, _TEST_SECRET, algorithm="HS256")

    def _request(self, token: str | None):
        class Req:
            headers = {"Authorization": f"Bearer {token}"} if token else {}
        return Req()

    def test_authenticates_valid_access_token(self) -> None:
        from datetime import datetime, timedelta, timezone

        from shared.infrastructure.http.custom_jwt_authentication import (
            ClaimsBasedJWTAuthentication,
        )

        exp = datetime.now(timezone.utc) + timedelta(minutes=10)
        token = self._encode(sub="u-1", correo="a@b.com", roles=["ADMIN"],
                             typ="access", exp=exp)
        user, claims = ClaimsBasedJWTAuthentication().authenticate(self._request(token))
        self.assertEqual(user.id, "u-1")
        self.assertEqual(user.email, "a@b.com")
        self.assertTrue(user.is_authenticated)
        self.assertEqual(claims["roles"], ["ADMIN"])

    def test_rejects_refresh_token(self) -> None:
        from datetime import datetime, timedelta, timezone

        from rest_framework.exceptions import AuthenticationFailed

        from shared.infrastructure.http.custom_jwt_authentication import (
            ClaimsBasedJWTAuthentication,
        )

        exp = datetime.now(timezone.utc) + timedelta(days=1)
        token = self._encode(sub="u-1", typ="refresh", exp=exp)
        with self.assertRaises(AuthenticationFailed):
            ClaimsBasedJWTAuthentication().authenticate(self._request(token))

    def test_no_header_returns_none(self) -> None:
        from shared.infrastructure.http.custom_jwt_authentication import (
            ClaimsBasedJWTAuthentication,
        )

        self.assertIsNone(ClaimsBasedJWTAuthentication().authenticate(self._request(None)))


# -- Observability (Prometheus middleware / endpoint) ------------------------
class _Resp:
    def __init__(self, status_code: int) -> None:
        self.status_code = status_code


class _MetricsReq:
    def __init__(self, method: str, path: str, route: str | None) -> None:
        self.method = method
        self.path = path
        self.resolver_match = type("M", (), {"route": route})() if route else None


class PrometheusMiddlewareTests(SimpleTestCase):
    def _sample(self, name, labels):  # noqa: ANN001
        from prometheus_client import REGISTRY

        return REGISTRY.get_sample_value(name, labels) or 0.0

    def test_counts_requests_and_observes_latency(self) -> None:
        from shared.interfaces.rest.metrics_middleware import PrometheusMiddleware

        labels = {"method": "GET", "endpoint": "health/", "status": "200"}
        before = self._sample("intifix_http_requests_total", labels)

        mw = PrometheusMiddleware(lambda request: _Resp(200))
        mw(_MetricsReq("GET", "/health/", "health/"))

        after = self._sample("intifix_http_requests_total", labels)
        self.assertEqual(after, before + 1)

    def test_counts_server_errors(self) -> None:
        from shared.interfaces.rest.metrics_middleware import PrometheusMiddleware

        labels = {"method": "POST", "endpoint": "boom/"}
        before = self._sample("intifix_http_errors_total", labels)

        mw = PrometheusMiddleware(lambda request: _Resp(500))
        mw(_MetricsReq("POST", "/boom/", "boom/"))

        after = self._sample("intifix_http_errors_total", labels)
        self.assertEqual(after, before + 1)

    def test_metrics_endpoint_exposes_prometheus_format(self) -> None:
        response = self.client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/plain", response["Content-Type"])
        self.assertIn(b"intifix_http_requests_total", response.content)
