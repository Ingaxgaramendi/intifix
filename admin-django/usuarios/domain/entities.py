"""Domain entities for the Users bounded context (admin view of a platform user)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"
    BANNED = "banned"


class UserRole(str, Enum):
    """Platform roles, used by the admin to filter the user base."""

    CLIENT = "client"
    TECHNICIAN = "technician"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


#: Allowed status transitions, keyed by the *target* status. A transition is
#: legal only if the user's current status is in the corresponding set. This is
#: the single source of truth for the suspend / activate / ban business rules
#: (banning is terminal: a banned user cannot be suspended or reactivated here).
ALLOWED_STATUS_TRANSITIONS: dict[UserStatus, frozenset[UserStatus]] = {
    UserStatus.SUSPENDED: frozenset({UserStatus.ACTIVE, UserStatus.PENDING}),
    UserStatus.ACTIVE: frozenset({UserStatus.SUSPENDED, UserStatus.PENDING}),
    UserStatus.BANNED: frozenset(
        {UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.PENDING}
    ),
}


@dataclass(frozen=True, slots=True)
class User:
    id: str
    email: str
    full_name: str
    status: UserStatus
    role: UserRole = UserRole.CLIENT
    phone: str | None = None
    is_verified: bool = False
    created_at: datetime | None = None

    @property
    def is_active(self) -> bool:
        return self.status is UserStatus.ACTIVE

    @property
    def is_banned(self) -> bool:
        return self.status is UserStatus.BANNED

    def can_transition_to(self, target: UserStatus) -> bool:
        """Whether moving this user to ``target`` is allowed by the policy."""
        return self.status in ALLOWED_STATUS_TRANSITIONS.get(target, frozenset())
