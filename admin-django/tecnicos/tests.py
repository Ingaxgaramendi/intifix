"""
Unit tests for the Technicians moderation context.

The use cases depend only on the ``TechnicianRepository`` port, so they run
against an in-memory fake — no HTTP, no Mongo, no microservices.
"""
from __future__ import annotations

from dataclasses import replace

from django.test import SimpleTestCase

from shared.domain.entities import AuditEvent, Page

from tecnicos.application.dtos import ListTechniciansQuery
from tecnicos.application.use_cases import (
    ApproveTechnician,
    GetTechnician,
    GetTechnicianDocuments,
    ListTechnicians,
    RejectTechnician,
    SuspendTechnician,
)
from tecnicos.domain.entities import (
    DocumentType,
    Technician,
    TechnicianDocument,
    TechnicianStatus,
)
from tecnicos.domain.exceptions import (
    InvalidStatusTransitionError,
    TechnicianAlreadyInStatusError,
)
from tecnicos.domain.ports import TechnicianRepository


def _tech(**overrides) -> Technician:
    base = Technician(
        id="t1",
        full_name="Beto Técnico",
        email="beto@b.com",
        status=TechnicianStatus.PENDING,
        specialties=("electricidad",),
    )
    return replace(base, **overrides)


_DOCS = [
    TechnicianDocument(type=DocumentType.DNI_FRONT, url="https://x/df.jpg"),
    TechnicianDocument(type=DocumentType.DNI_BACK, url="https://x/db.jpg"),
    TechnicianDocument(type=DocumentType.BACKGROUND_CHECK, url="https://x/bg.pdf"),
    TechnicianDocument(type=DocumentType.CERTIFICATE, url="https://x/cert.pdf"),
]


class FakeTechnicianRepository(TechnicianRepository):
    def __init__(self, tech: Technician) -> None:
        self._tech = tech
        self.list_kwargs: dict | None = None

    def list(self, **kwargs) -> Page[Technician]:
        self.list_kwargs = kwargs
        return Page(items=[self._tech], total=1,
                    page=kwargs["page"], page_size=kwargs["page_size"])

    def get(self, technician_id: str) -> Technician:
        return self._tech

    def set_status(self, technician_id: str, status: str) -> Technician:
        self._tech = replace(self._tech, status=TechnicianStatus(status))
        return self._tech

    def list_documents(self, technician_id: str) -> list[TechnicianDocument]:
        return _DOCS


class RecordingAudit:
    def __init__(self) -> None:
        self.events: list[AuditEvent] = []

    def record(self, event: AuditEvent) -> None:
        self.events.append(event)


class ListAndGetTests(SimpleTestCase):
    def test_list_forwards_filters_and_maps_dto(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.APPROVED))
        page = ListTechnicians(repo).execute(
            ListTechniciansQuery(page=1, page_size=10, search="beto", status="approved")
        )
        self.assertEqual(repo.list_kwargs["status"], "approved")
        self.assertEqual(page.results[0].status, "approved")
        self.assertEqual(page.results[0].specialties, ["electricidad"])

    def test_get_returns_dto(self) -> None:
        dto = GetTechnician(FakeTechnicianRepository(_tech())).execute("t1")
        self.assertEqual(dto.status, "pending")


class DocumentsTests(SimpleTestCase):
    def test_lists_all_kyc_documents(self) -> None:
        docs = GetTechnicianDocuments(FakeTechnicianRepository(_tech())).execute("t1")
        types = {d.type for d in docs}
        self.assertEqual(
            types,
            {"dni_front", "dni_back", "background_check", "certificate"},
        )


class ApproveTests(SimpleTestCase):
    def test_pending_can_be_approved_and_audited(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.PENDING))
        audit = RecordingAudit()
        dto = ApproveTechnician(repo, audit).execute(technician_id="t1", actor_id="admin")
        self.assertEqual(dto.status, "approved")
        self.assertEqual(audit.events[0].action, "technicians.approve")

    def test_suspended_can_be_reapproved(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.SUSPENDED))
        dto = ApproveTechnician(repo).execute(technician_id="t1", actor_id="admin")
        self.assertEqual(dto.status, "approved")

    def test_already_approved_raises(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.APPROVED))
        with self.assertRaises(TechnicianAlreadyInStatusError):
            ApproveTechnician(repo).execute(technician_id="t1", actor_id="admin")


class RejectTests(SimpleTestCase):
    def test_pending_can_be_rejected(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.PENDING))
        audit = RecordingAudit()
        dto = RejectTechnician(repo, audit).execute(
            technician_id="t1", actor_id="admin", reason="DNI ilegible"
        )
        self.assertEqual(dto.status, "rejected")
        self.assertEqual(audit.events[0].metadata["reason"], "DNI ilegible")

    def test_approved_cannot_be_rejected(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.APPROVED))
        with self.assertRaises(InvalidStatusTransitionError):
            RejectTechnician(repo).execute(technician_id="t1", actor_id="admin")


class SuspendTests(SimpleTestCase):
    def test_approved_can_be_suspended(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.APPROVED))
        dto = SuspendTechnician(repo).execute(technician_id="t1", actor_id="admin")
        self.assertEqual(dto.status, "suspended")

    def test_pending_cannot_be_suspended(self) -> None:
        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.PENDING))
        with self.assertRaises(InvalidStatusTransitionError):
            SuspendTechnician(repo).execute(technician_id="t1", actor_id="admin")

    def test_audit_failure_does_not_break_operation(self) -> None:
        class BrokenAudit:
            def record(self, event: AuditEvent) -> None:
                raise RuntimeError("mongo down")

        repo = FakeTechnicianRepository(_tech(status=TechnicianStatus.APPROVED))
        dto = SuspendTechnician(repo, BrokenAudit()).execute(
            technician_id="t1", actor_id="admin"
        )
        self.assertEqual(dto.status, "suspended")
