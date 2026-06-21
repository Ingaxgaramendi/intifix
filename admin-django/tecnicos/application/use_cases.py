"""
Application use cases (services) for the Technicians context.

Pure orchestration over the ``TechnicianRepository`` port — no HTTP, no DRF.
Moderation actions go through ``_TransitionTechnicianStatus``, which enforces
the domain transition policy before calling the Technicians Service and records
an audit event afterwards. Approve / Reject / Suspend specialize it.
"""
from __future__ import annotations

import logging

from shared.domain.entities import AuditEvent, Page
from shared.infrastructure.mongo.audit_repository import AuditRepository

from ..domain.entities import Technician, TechnicianStatus
from ..domain.exceptions import (
    InvalidStatusTransitionError,
    TechnicianAlreadyInStatusError,
)
from ..domain.ports import TechnicianRepository
from .dtos import (
    ListTechniciansQuery,
    TechnicianDocumentDTO,
    TechnicianDTO,
    TechnicianPageDTO,
)

logger = logging.getLogger("intifix")

__all__ = [
    "ListTechniciansQuery",
    "ListTechnicians",
    "GetTechnician",
    "GetTechnicianDocuments",
    "ApproveTechnician",
    "RejectTechnician",
    "SuspendTechnician",
]


class ListTechnicians:
    def __init__(self, repository: TechnicianRepository) -> None:
        self._repository = repository

    def execute(self, query: ListTechniciansQuery) -> TechnicianPageDTO:
        page: Page[Technician] = self._repository.list(
            page=query.page,
            page_size=query.page_size,
            search=query.search,
            status=query.status,
        )
        return TechnicianPageDTO(
            results=[TechnicianDTO.from_entity(t) for t in page.items],
            count=page.total,
            page=page.page,
            num_pages=page.num_pages,
        )


class GetTechnician:
    def __init__(self, repository: TechnicianRepository) -> None:
        self._repository = repository

    def execute(self, technician_id: str) -> TechnicianDTO:
        return TechnicianDTO.from_entity(self._repository.get(technician_id))


class GetTechnicianDocuments:
    """List the KYC documents (DNI front/back, background check, certificates)."""

    def __init__(self, repository: TechnicianRepository) -> None:
        self._repository = repository

    def execute(self, technician_id: str) -> list[TechnicianDocumentDTO]:
        docs = self._repository.list_documents(technician_id)
        return [TechnicianDocumentDTO.from_entity(d) for d in docs]


class _TransitionTechnicianStatus:
    """Base use case: validate the transition, apply it, audit it."""

    target: TechnicianStatus
    action: str

    def __init__(
        self,
        repository: TechnicianRepository,
        audit: AuditRepository | None = None,
    ) -> None:
        self._repository = repository
        self._audit = audit

    def execute(
        self, *, technician_id: str, actor_id: str, reason: str | None = None
    ) -> TechnicianDTO:
        current = self._repository.get(technician_id)

        if current.status is self.target:
            raise TechnicianAlreadyInStatusError(status=self.target)
        if not current.can_transition_to(self.target):
            raise InvalidStatusTransitionError(current=current.status, target=self.target)

        updated = self._repository.set_status(technician_id, self.target.value)
        self._record_audit(technician_id=technician_id, actor_id=actor_id, reason=reason)
        return TechnicianDTO.from_entity(updated)

    def _record_audit(self, *, technician_id: str, actor_id: str, reason: str | None) -> None:
        if self._audit is None:
            return
        metadata = {"new_status": self.target.value}
        if reason:
            metadata["reason"] = reason
        try:
            self._audit.record(
                AuditEvent(
                    actor_id=actor_id,
                    action=self.action,
                    resource="technician",
                    resource_id=technician_id,
                    metadata=metadata,
                )
            )
        except Exception:  # noqa: BLE001 - audit must never break the operation
            logger.exception("failed to record audit event action=%s technician=%s",
                             self.action, technician_id)


class ApproveTechnician(_TransitionTechnicianStatus):
    target = TechnicianStatus.APPROVED
    action = "technicians.approve"


class RejectTechnician(_TransitionTechnicianStatus):
    target = TechnicianStatus.REJECTED
    action = "technicians.reject"


class SuspendTechnician(_TransitionTechnicianStatus):
    target = TechnicianStatus.SUSPENDED
    action = "technicians.suspend"
