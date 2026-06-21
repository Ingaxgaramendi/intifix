"""
Role/permission-based access control for the admin panel.

The JWT issued by the Auth Service carries a ``roles`` claim (list of strings).
Roles are mapped to granular permissions by ``shared.domain.rbac``; endpoints
declare the *permission* they need (least privilege) rather than a role, so the
role→permission policy can evolve without touching the views.

Resolution prefers the DRF-validated token (``request.auth``); it falls back to
the principal published by ``RBACMiddleware`` so non-DRF code paths still work.
"""
from __future__ import annotations

from collections.abc import Iterable

from rest_framework.permissions import BasePermission

from shared.domain.rbac import Permission, Role, permissions_for
from shared.interfaces.rest.rbac_context import current_principal


def _roles_from_request(request) -> tuple[str, ...]:  # noqa: ANN001
    token = getattr(request, "auth", None)
    if token is not None and hasattr(token, "get"):
        roles = token.get("roles", []) or []
        if isinstance(roles, (list, tuple)):
            return tuple(roles)
        return (roles,)
    # Fall back to the middleware-resolved principal.
    return current_principal().roles


def effective_permissions(request) -> frozenset[Permission]:  # noqa: ANN001
    """The set of permissions granted to the request's principal."""
    granted = permissions_for(_roles_from_request(request))
    if granted:
        return granted
    return current_principal().permissions


# -- Role-based (kept for backward compatibility) ----------------------------
class HasRole(BasePermission):
    """Grant access if the token carries one of ``required_roles``."""

    required_roles: tuple[str, ...] = ()

    @classmethod
    def of(cls, *roles: str) -> type["HasRole"]:
        return type(f"HasRole_{'_'.join(roles)}", (cls,), {"required_roles": roles})

    def has_permission(self, request, view) -> bool:  # noqa: ANN001
        wanted = {Role.from_claim(r) for r in self.required_roles}
        have = {Role.from_claim(r) for r in _roles_from_request(request)}
        return bool(wanted & (have - {None}))


class IsAdmin(HasRole):
    """ADMIN or SUPER_ADMIN — the broad administrative gate."""

    required_roles = ("admin", "super_admin")


# -- Permission-based (preferred, granular) ----------------------------------
class HasPermission(BasePermission):
    """Grant access when the principal holds the required permission(s).

    Usage::

        permission_classes = [IsAuthenticated, HasPermission.of(Permission.USERS_BAN)]
    """

    required_permissions: tuple[Permission, ...] = ()
    require_all: bool = True

    @classmethod
    def of(cls, *permissions: Permission, require_all: bool = True) -> type["HasPermission"]:
        name = "_".join(p.name for p in permissions) or "ANY"
        return type(
            f"HasPermission_{name}",
            (cls,),
            {"required_permissions": tuple(permissions), "require_all": require_all},
        )

    def has_permission(self, request, view) -> bool:  # noqa: ANN001
        granted = effective_permissions(request)
        if not self.required_permissions:
            return bool(granted)
        check = all if self.require_all else any
        return check(p in granted for p in self.required_permissions)


def HasAnyPermission(*permissions: Permission) -> type[HasPermission]:  # noqa: N802
    """Convenience: pass if the principal holds *any* of the permissions."""
    return HasPermission.of(*permissions, require_all=False)


def principal_has(request, *permissions: Permission, require_all: bool = True) -> bool:  # noqa: ANN001
    """Imperative check usable inside view bodies / decorators."""
    granted = effective_permissions(request)
    check = all if require_all else any
    return check(p in granted for p in permissions)
