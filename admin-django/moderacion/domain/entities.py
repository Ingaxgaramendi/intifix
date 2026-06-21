"""Domain entities for the Moderation bounded context (admin moderation center)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class ReportStatus(str, Enum):
    PENDIENTE = "pendiente"
    EN_REVISION = "en_revision"
    RESUELTO = "resuelto"


#: Allowed report transitions, keyed by the *target* status. A transition is
#: legal only if the report's current status is in the corresponding set. This
#: enforces the moderation workflow: a report must be reviewed before it can be
#: resolved.
#:   - review:  pendiente    -> en_revision
#:   - resolve: en_revision  -> resuelto
ALLOWED_STATUS_TRANSITIONS: dict[ReportStatus, frozenset[ReportStatus]] = {
    ReportStatus.EN_REVISION: frozenset({ReportStatus.PENDIENTE}),
    ReportStatus.RESUELTO: frozenset({ReportStatus.EN_REVISION}),
}


@dataclass(frozen=True, slots=True)
class Report:
    """A user/service report surfaced from the Services Service (read model)."""

    id: str
    reason: str
    status: ReportStatus
    reported_user_id: str | None = None
    service_id: str | None = None
    reporter_id: str | None = None
    description: str = ""
    created_at: datetime | None = None

    def can_transition_to(self, target: ReportStatus) -> bool:
        return self.status in ALLOWED_STATUS_TRANSITIONS.get(target, frozenset())


@dataclass(frozen=True, slots=True)
class InternalComment:
    """A moderator-only note attached to a report — never visible to end users."""

    report_id: str
    author_id: str
    body: str
    created_at: datetime | None = None


@dataclass(frozen=True, slots=True)
class HistoryEntry:
    """A single event in a report's moderation timeline (panel-owned history)."""

    report_id: str
    actor_id: str
    action: str
    from_status: str | None = None
    to_status: str | None = None
    note: str | None = None
    created_at: datetime | None = None
