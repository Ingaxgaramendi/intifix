"""Domain entities for the Technicians bounded context (admin moderation view)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class TechnicianStatus(str, Enum):
    PENDING = "pending"      # awaiting moderation
    APPROVED = "approved"    # vetted, can take jobs
    REJECTED = "rejected"    # vetting failed (terminal)
    SUSPENDED = "suspended"  # temporarily disabled


class DocumentType(str, Enum):
    DNI_FRONT = "dni_front"
    DNI_BACK = "dni_back"
    BACKGROUND_CHECK = "background_check"
    CERTIFICATE = "certificate"


#: Allowed status transitions, keyed by the *target* status. A transition is
#: legal only if the technician's current status is in the corresponding set.
#: This is the single source of truth for the approve / reject / suspend rules.
#:   - approve:  pending or suspended  -> approved
#:   - reject:   pending               -> rejected (terminal)
#:   - suspend:  approved              -> suspended
ALLOWED_STATUS_TRANSITIONS: dict[TechnicianStatus, frozenset[TechnicianStatus]] = {
    TechnicianStatus.APPROVED: frozenset(
        {TechnicianStatus.PENDING, TechnicianStatus.SUSPENDED}
    ),
    TechnicianStatus.REJECTED: frozenset({TechnicianStatus.PENDING}),
    TechnicianStatus.SUSPENDED: frozenset({TechnicianStatus.APPROVED}),
}


@dataclass(frozen=True, slots=True)
class TechnicianDocument:
    """A KYC document owned by the Technicians Service — never stored locally.

    The admin panel only surfaces its metadata and a (typically signed, expiring)
    URL so a moderator can review it.
    ``label`` is an optional human-readable override (used for per-specialty
    certificates where the specialty name gives more context than the generic
    "certificate" type label).
    """

    type: DocumentType
    url: str
    verified: bool = False
    uploaded_at: datetime | None = None
    label: str | None = None


@dataclass(frozen=True, slots=True)
class Technician:
    id: str
    full_name: str
    email: str
    status: TechnicianStatus
    specialties: tuple[str, ...] = ()
    phone: str | None = None
    rating: float | None = None
    documents_complete: bool = False
    created_at: datetime | None = None

    @property
    def is_approved(self) -> bool:
        return self.status is TechnicianStatus.APPROVED

    def can_transition_to(self, target: TechnicianStatus) -> bool:
        return self.status in ALLOWED_STATUS_TRANSITIONS.get(target, frozenset())
