"""
Exceptions specific to the Moderation bounded context.

They subclass the shared ``DomainError`` taxonomy so the centralized DRF
exception handler renders them with the right HTTP status and error envelope.
"""
from __future__ import annotations

from shared.domain.exceptions import DomainError

from .entities import ReportStatus


class InvalidReportTransitionError(DomainError):
    """The requested status change is not allowed from the report's current status."""

    status_code = 409
    code = "invalid_report_transition"

    def __init__(self, *, current: ReportStatus, target: ReportStatus) -> None:
        super().__init__(
            f"A report in status '{current.value}' cannot transition to "
            f"'{target.value}'.",
            details={"current_status": current.value, "target_status": target.value},
        )


class ReportAlreadyInStatusError(DomainError):
    """The report is already in the requested status — the action is a no-op."""

    status_code = 409
    code = "report_already_in_status"

    def __init__(self, *, status: ReportStatus) -> None:
        super().__init__(
            f"The report is already '{status.value}'.",
            details={"current_status": status.value},
        )
