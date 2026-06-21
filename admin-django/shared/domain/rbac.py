"""
Role-Based Access Control model (framework-agnostic).

This is the single source of truth for *who can do what* in the admin panel:

  * ``Permission`` — a granular, dotted capability (e.g. ``users.ban``).
  * ``Role``       — one of the five admin roles carried in the JWT ``roles`` claim.
  * ``ROLE_PERMISSIONS`` — the role → permission "groups", designed around the
    **principle of least privilege**: each role is granted only the permissions
    its job requires. ``SUPER_ADMIN`` is the sole super-user (all permissions);
    ``AUDITOR`` and ``SOPORTE`` are read-mostly; ``MODERADOR`` moderates content
    and users but cannot perform the most destructive actions (ban, refund),
    which escalate to ``ADMIN`` / ``SUPER_ADMIN``.

The Auth Service issues the JWT; this panel only *maps* its roles to permissions
and enforces them at each endpoint (see ``shared.interfaces.rest``).
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field
from enum import Enum


class Permission(str, Enum):
    # Dashboard / monitoring
    DASHBOARD_VIEW = "dashboard.view"
    # Users
    USERS_VIEW = "users.view"
    USERS_SUSPEND = "users.suspend"
    USERS_ACTIVATE = "users.activate"
    USERS_BAN = "users.ban"
    USERS_BLOCK = "users.block"
    USERS_UNBLOCK = "users.unblock"
    # Technicians
    TECHNICIANS_VIEW = "technicians.view"
    TECHNICIANS_DOCUMENTS_VIEW = "technicians.documents.view"
    TECHNICIANS_APPROVE = "technicians.approve"
    TECHNICIANS_REJECT = "technicians.reject"
    TECHNICIANS_SUSPEND = "technicians.suspend"
    # Moderation / reports
    REPORTS_VIEW = "reports.view"
    REPORTS_REVIEW = "reports.review"
    REPORTS_RESOLVE = "reports.resolve"
    REPORTS_COMMENT = "reports.comment"
    # Payments
    PAYMENTS_VIEW = "payments.view"
    PAYMENTS_REFUND = "payments.refund"
    # Support
    SUPPORT_VIEW = "support.view"
    # Audit
    AUDIT_VIEW = "audit.view"


class Role(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERADOR = "moderador"
    SOPORTE = "soporte"
    AUDITOR = "auditor"

    @classmethod
    def from_claim(cls, value: str) -> "Role | None":
        """Tolerantly map a JWT role string (incl. legacy aliases) to a Role."""
        if not value:
            return None
        normalized = value.strip().lower().replace("-", "_")
        try:
            return cls(normalized)
        except ValueError:
            return _ROLE_ALIASES.get(normalized)


_ROLE_ALIASES: dict[str, Role] = {
    "superadmin": Role.SUPER_ADMIN,
    "super": Role.SUPER_ADMIN,
    "administrator": Role.ADMIN,
    "moderator": Role.MODERADOR,
    "support": Role.SOPORTE,
    "auditer": Role.AUDITOR,
}

# Every read permission, reused by the read-mostly roles.
_VIEW_PERMISSIONS: frozenset[Permission] = frozenset({
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.TECHNICIANS_VIEW,
    Permission.TECHNICIANS_DOCUMENTS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.PAYMENTS_VIEW,
    Permission.SUPPORT_VIEW,
})

ALL_PERMISSIONS: frozenset[Permission] = frozenset(Permission)

ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    # Super-user: everything.
    Role.SUPER_ADMIN: ALL_PERMISSIONS,
    # Full operational management, including destructive actions.
    Role.ADMIN: ALL_PERMISSIONS,
    # Content & user moderation; no ban/refund (escalate), no audit, no payments.
    Role.MODERADOR: frozenset({
        Permission.DASHBOARD_VIEW,
        Permission.USERS_VIEW,
        Permission.USERS_SUSPEND,
        Permission.USERS_ACTIVATE,
        Permission.USERS_BLOCK,
        Permission.USERS_UNBLOCK,
        Permission.TECHNICIANS_VIEW,
        Permission.TECHNICIANS_DOCUMENTS_VIEW,
        Permission.TECHNICIANS_APPROVE,
        Permission.TECHNICIANS_REJECT,
        Permission.TECHNICIANS_SUSPEND,
        Permission.REPORTS_VIEW,
        Permission.REPORTS_REVIEW,
        Permission.REPORTS_RESOLVE,
        Permission.REPORTS_COMMENT,
    }),
    # First-line support: read-mostly, may annotate reports.
    Role.SOPORTE: _VIEW_PERMISSIONS | {Permission.REPORTS_COMMENT},
    # Oversight: strictly read-only across the panel + the audit trail.
    Role.AUDITOR: _VIEW_PERMISSIONS | {Permission.AUDIT_VIEW},
}

# ADMIN is broad but, unlike SUPER_ADMIN, is conventionally not the holder of
# the audit trail's exclusive oversight; keep them aligned here while leaving a
# single, obvious place to diverge the two if policy later requires it.


def permissions_for(role_names: Iterable[str]) -> frozenset[Permission]:
    """Union of the permissions granted by every recognized role name."""
    granted: set[Permission] = set()
    for name in role_names or ():
        role = Role.from_claim(name) if isinstance(name, str) else None
        if role is not None:
            granted |= ROLE_PERMISSIONS.get(role, frozenset())
    return frozenset(granted)


@dataclass(frozen=True, slots=True)
class Principal:
    """The authenticated admin acting on a request."""

    admin_id: str | None = None
    roles: tuple[str, ...] = ()
    permissions: frozenset[Permission] = field(default_factory=frozenset)

    @property
    def is_authenticated(self) -> bool:
        return self.admin_id is not None

    def has(self, permission: Permission) -> bool:
        return permission in self.permissions

    @classmethod
    def build(cls, *, admin_id: str | None, roles: Iterable[str]) -> "Principal":
        role_tuple = tuple(roles or ())
        return cls(
            admin_id=admin_id,
            roles=role_tuple,
            permissions=permissions_for(role_tuple),
        )


ANONYMOUS = Principal()
