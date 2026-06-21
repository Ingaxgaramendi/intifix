"""
Unit tests for the Moderation context.

The use cases depend only on the domain ports, so they run against in-memory
fakes — no HTTP, no Mongo, no microservices.
"""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone

from django.test import SimpleTestCase

from shared.domain.entities import AuditEvent, Page

from moderacion.application.dtos import ListReportsQuery
from moderacion.application.use_cases import (
    AddInternalComment,
    BlockUser,
    GetReportHistory,
    ListInternalComments,
    ListReports,
    ResolveReport,
    ReviewReport,
    UnblockUser,
)
from moderacion.domain.entities import (
    HistoryEntry,
    InternalComment,
    Report,
    ReportStatus,
)
from moderacion.domain.exceptions import (
    InvalidReportTransitionError,
    ReportAlreadyInStatusError,
)
from moderacion.domain.ports import (
    CommentStore,
    HistoryStore,
    ReportRepository,
    UserBlockGateway,
)


def _report(**overrides) -> Report:
    base = Report(
        id="r1",
        reason="abuso",
        status=ReportStatus.PENDIENTE,
        reported_user_id="u9",
        description="comportamiento indebido",
    )
    return replace(base, **overrides)


class FakeReportRepository(ReportRepository):
    def __init__(self, report: Report) -> None:
        self._report = report
        self.list_kwargs: dict | None = None

    def list(self, **kwargs) -> Page[Report]:
        self.list_kwargs = kwargs
        return Page(items=[self._report], total=1,
                    page=kwargs["page"], page_size=kwargs["page_size"])

    def get(self, report_id: str) -> Report:
        return self._report

    def set_status(self, report_id: str, status: str) -> Report:
        self._report = replace(self._report, status=ReportStatus(status))
        return self._report


class FakeHistoryStore(HistoryStore):
    def __init__(self) -> None:
        self.entries: list[HistoryEntry] = []

    def append(self, entry: HistoryEntry) -> None:
        self.entries.append(entry)

    def list(self, report_id: str) -> list[HistoryEntry]:
        return [e for e in self.entries if e.report_id == report_id]


class FakeCommentStore(CommentStore):
    def __init__(self) -> None:
        self.comments: list[InternalComment] = []

    def add(self, comment: InternalComment) -> InternalComment:
        stored = replace(comment, created_at=datetime.now(timezone.utc))
        self.comments.append(stored)
        return stored

    def list(self, report_id: str) -> list[InternalComment]:
        return [c for c in self.comments if c.report_id == report_id]


class FakeUserBlockGateway(UserBlockGateway):
    def __init__(self) -> None:
        self.blocked: list[str] = []
        self.unblocked: list[str] = []

    def block(self, user_id: str, *, reason: str | None = None) -> None:
        self.blocked.append(user_id)

    def unblock(self, user_id: str) -> None:
        self.unblocked.append(user_id)


class RecordingAudit:
    def __init__(self) -> None:
        self.events: list[AuditEvent] = []

    def record(self, event: AuditEvent) -> None:
        self.events.append(event)


class ListReportsTests(SimpleTestCase):
    def test_forwards_filters_and_maps_dto(self) -> None:
        repo = FakeReportRepository(_report(status=ReportStatus.EN_REVISION))
        page = ListReports(repo).execute(
            ListReportsQuery(page=1, page_size=10, status="en_revision", search="abuso")
        )
        self.assertEqual(repo.list_kwargs["status"], "en_revision")
        self.assertEqual(page.results[0].status, "en_revision")


class ReviewResolveTests(SimpleTestCase):
    def test_review_pending_moves_to_en_revision_with_history_and_audit(self) -> None:
        repo = FakeReportRepository(_report(status=ReportStatus.PENDIENTE))
        history, audit = FakeHistoryStore(), RecordingAudit()
        dto = ReviewReport(repo, history, audit).execute(
            report_id="r1", actor_id="mod", note="revisando"
        )
        self.assertEqual(dto.status, "en_revision")
        self.assertEqual(history.entries[0].action, "moderation.report.review")
        self.assertEqual(history.entries[0].to_status, "en_revision")
        self.assertEqual(audit.events[0].metadata["from_status"], "pendiente")

    def test_resolve_requires_review_first(self) -> None:
        repo = FakeReportRepository(_report(status=ReportStatus.PENDIENTE))
        with self.assertRaises(InvalidReportTransitionError):
            ResolveReport(repo).execute(report_id="r1", actor_id="mod")

    def test_resolve_from_en_revision(self) -> None:
        repo = FakeReportRepository(_report(status=ReportStatus.EN_REVISION))
        dto = ResolveReport(repo).execute(report_id="r1", actor_id="mod")
        self.assertEqual(dto.status, "resuelto")

    def test_review_already_in_review_raises(self) -> None:
        repo = FakeReportRepository(_report(status=ReportStatus.EN_REVISION))
        with self.assertRaises(ReportAlreadyInStatusError):
            ReviewReport(repo).execute(report_id="r1", actor_id="mod")

    def test_history_failure_does_not_break_transition(self) -> None:
        class BrokenHistory(FakeHistoryStore):
            def append(self, entry: HistoryEntry) -> None:
                raise RuntimeError("mongo down")

        repo = FakeReportRepository(_report(status=ReportStatus.PENDIENTE))
        dto = ReviewReport(repo, BrokenHistory(), None).execute(report_id="r1", actor_id="mod")
        self.assertEqual(dto.status, "en_revision")


class InternalCommentTests(SimpleTestCase):
    def test_add_and_list_comments_and_logs_history(self) -> None:
        store, history = FakeCommentStore(), FakeHistoryStore()
        AddInternalComment(store, history).execute(
            report_id="r1", author_id="mod", body="usuario reincidente"
        )
        listed = ListInternalComments(store).execute("r1")
        self.assertEqual(listed[0].body, "usuario reincidente")
        self.assertEqual(history.entries[0].action, "moderation.comment.add")


class ReportHistoryTests(SimpleTestCase):
    def test_returns_chronological_entries(self) -> None:
        history = FakeHistoryStore()
        history.append(HistoryEntry(report_id="r1", actor_id="mod", action="a"))
        history.append(HistoryEntry(report_id="r2", actor_id="mod", action="b"))
        entries = GetReportHistory(history).execute("r1")
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0].action, "a")


class UserBlockTests(SimpleTestCase):
    def test_block_user_calls_gateway_and_audits(self) -> None:
        gateway, audit, history = FakeUserBlockGateway(), RecordingAudit(), FakeHistoryStore()
        BlockUser(gateway, history, audit).execute(
            user_id="u9", actor_id="mod", report_id="r1", reason="fraude"
        )
        self.assertEqual(gateway.blocked, ["u9"])
        self.assertEqual(audit.events[0].action, "moderation.user.block")
        self.assertEqual(audit.events[0].resource, "user")

    def test_unblock_user_calls_gateway(self) -> None:
        gateway = FakeUserBlockGateway()
        UnblockUser(gateway).execute(user_id="u9", actor_id="mod")
        self.assertEqual(gateway.unblocked, ["u9"])
