"""
Exceptions specific to the Users bounded context.

They subclass the shared ``DomainError`` taxonomy so the centralized DRF
exception handler renders them with the right HTTP status and error envelope —
the domain never imports DRF (Separation of Concerns).
"""
from __future__ import annotations

from shared.domain.exceptions import DomainError

from .entities import UserStatus


class InvalidStatusTransitionError(DomainError):
    """The requested status change is not allowed from the current status."""

    status_code = 409
    code = "invalid_status_transition"

    def __init__(self, *, current: UserStatus, target: UserStatus) -> None:
        super().__init__(
            f"A user in status '{current.value}' cannot transition to "
            f"'{target.value}'.",
            details={"current_status": current.value, "target_status": target.value},
        )


class UserAlreadyInStatusError(DomainError):
    """The user is already in the requested status — the action is a no-op."""

    status_code = 409
    code = "user_already_in_status"

    def __init__(self, *, status: UserStatus) -> None:
        super().__init__(
            f"The user is already '{status.value}'.",
            details={"current_status": status.value},
        )
