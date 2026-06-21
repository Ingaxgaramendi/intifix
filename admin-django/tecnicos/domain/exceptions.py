"""
Exceptions specific to the Technicians bounded context.

They subclass the shared ``DomainError`` taxonomy so the centralized DRF
exception handler renders them with the right HTTP status and error envelope.
"""
from __future__ import annotations

from shared.domain.exceptions import DomainError

from .entities import TechnicianStatus


class InvalidStatusTransitionError(DomainError):
    """The requested moderation action is not allowed from the current status."""

    status_code = 409
    code = "invalid_status_transition"

    def __init__(self, *, current: TechnicianStatus, target: TechnicianStatus) -> None:
        super().__init__(
            f"A technician in status '{current.value}' cannot transition to "
            f"'{target.value}'.",
            details={"current_status": current.value, "target_status": target.value},
        )


class TechnicianAlreadyInStatusError(DomainError):
    """The technician is already in the requested status — the action is a no-op."""

    status_code = 409
    code = "technician_already_in_status"

    def __init__(self, *, status: TechnicianStatus) -> None:
        super().__init__(
            f"The technician is already '{status.value}'.",
            details={"current_status": status.value},
        )
