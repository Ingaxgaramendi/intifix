"""
Application use cases (services) for the Moderation context.

Pure orchestration over the domain ports — no HTTP, no DRF. Every privileged
action records two things, both best-effort (a downstream/storage hiccup must
never undo an action that already succeeded upstream):
  * a **history** entry — the per-report moderation timeline (panel-owned).
  * an **audit** event — the global compliance trail (shared, Mongo).
"""
from __future__ import annotations

import logging

from shared.domain.entities import AuditEvent, Page
from shared.infrastructure.mongo.audit_repository import AuditRepository

from ..domain.entities import (
    HistoryEntry,
    InternalComment,
    Report,
    ReportStatus,
)
from ..domain.exceptions import (
    InvalidReportTransitionError,
    ReportAlreadyInStatusError,
)
from ..domain.ports import (
    CommentStore,
    HistoryStore,
    ReportRepository,
    UserBlockGateway,
)
from .dtos import (
    CommentDTO,
    HistoryEntryDTO,
    ListReportsQuery,
    ReportDTO,
    ReportPageDTO,
)

logger = logging.getLogger("intifix")

__all__ = [
    "ListReportsQuery",
    "ListReports",
    "GetReport",
    "ReviewReport",
    "ResolveReport",
    "AddInternalComment",
    "ListInternalComments",
    "GetReportHistory",
    "BlockUser",
    "UnblockUser",
]


class _Recorder:
    """Mixin: best-effort writes to the moderation history and the audit trail."""

    _history: HistoryStore | None
    _audit: AuditRepository | None

    def _record(
        self,
        *,
        report_id: str,
        actor_id: str,
        action: str,
        resource: str = "report",
        resource_id: str | None = None,
        from_status: str | None = None,
        to_status: str | None = None,
        note: str | None = None,
    ) -> None:
        if self._history is not None:
            try:
                self._history.append(
                    HistoryEntry(
                        report_id=report_id,
                        actor_id=actor_id,
                        action=action,
                        from_status=from_status,
                        to_status=to_status,
                        note=note,
                    )
                )
            except Exception:  # noqa: BLE001
                logger.exception("failed to append moderation history action=%s", action)

        if self._audit is not None:
            metadata = {k: v for k, v in {
                "from_status": from_status, "to_status": to_status,
                "note": note, "report_id": report_id,
            }.items() if v is not None}
            try:
                self._audit.record(
                    AuditEvent(
                        actor_id=actor_id,
                        action=action,
                        resource=resource,
                        resource_id=resource_id or report_id,
                        metadata=metadata,
                    )
                )
            except Exception:  # noqa: BLE001
                logger.exception("failed to record audit event action=%s", action)


# -- Read use cases ----------------------------------------------------------
class ListReports:
    def __init__(self, repository: ReportRepository) -> None:
        self._repository = repository

    def execute(self, query: ListReportsQuery) -> ReportPageDTO:
        page: Page[Report] = self._repository.list(
            page=query.page,
            page_size=query.page_size,
            status=query.status,
            search=query.search,
        )
        return ReportPageDTO(
            results=[ReportDTO.from_entity(r) for r in page.items],
            count=page.total,
            page=page.page,
            num_pages=page.num_pages,
        )


class GetReport:
    def __init__(self, repository: ReportRepository) -> None:
        self._repository = repository

    def execute(self, report_id: str) -> ReportDTO:
        return ReportDTO.from_entity(self._repository.get(report_id))


class GetReportHistory:
    def __init__(self, history: HistoryStore) -> None:
        self._history = history

    def execute(self, report_id: str) -> list[HistoryEntryDTO]:
        return [HistoryEntryDTO.from_entity(e) for e in self._history.list(report_id)]


class ListInternalComments:
    def __init__(self, comments: CommentStore) -> None:
        self._comments = comments

    def execute(self, report_id: str) -> list[CommentDTO]:
        return [CommentDTO.from_entity(c) for c in self._comments.list(report_id)]


# -- Write use cases ---------------------------------------------------------
class _TransitionReport(_Recorder):
    """Base: validate the report transition, apply it upstream, record it."""

    target: ReportStatus
    action: str

    def __init__(
        self,
        repository: ReportRepository,
        history: HistoryStore | None = None,
        audit: AuditRepository | None = None,
    ) -> None:
        self._repository = repository
        self._history = history
        self._audit = audit

    def execute(self, *, report_id: str, actor_id: str, note: str | None = None) -> ReportDTO:
        current = self._repository.get(report_id)

        if current.status is self.target:
            raise ReportAlreadyInStatusError(status=self.target)
        if not current.can_transition_to(self.target):
            raise InvalidReportTransitionError(current=current.status, target=self.target)

        updated = self._repository.set_status(report_id, self.target.value)
        self._record(
            report_id=report_id,
            actor_id=actor_id,
            action=self.action,
            from_status=current.status.value,
            to_status=self.target.value,
            note=note,
        )
        return ReportDTO.from_entity(updated)


class ReviewReport(_TransitionReport):
    target = ReportStatus.EN_REVISION
    action = "moderation.report.review"


class ResolveReport(_TransitionReport):
    target = ReportStatus.RESUELTO
    action = "moderation.report.resolve"


class AddInternalComment(_Recorder):
    """Attach a moderator-only comment to a report and log it to the history."""

    def __init__(
        self,
        comments: CommentStore,
        history: HistoryStore | None = None,
        audit: AuditRepository | None = None,
    ) -> None:
        self._comments = comments
        self._history = history
        self._audit = audit

    def execute(self, *, report_id: str, author_id: str, body: str) -> CommentDTO:
        comment = self._comments.add(
            InternalComment(report_id=report_id, author_id=author_id, body=body)
        )
        self._record(
            report_id=report_id,
            actor_id=author_id,
            action="moderation.comment.add",
            note=body,
        )
        return CommentDTO.from_entity(comment)


class BlockUser(_Recorder):
    """Block a user via the Users Service; optionally link it to a report."""

    def __init__(
        self,
        gateway: UserBlockGateway,
        history: HistoryStore | None = None,
        audit: AuditRepository | None = None,
    ) -> None:
        self._gateway = gateway
        self._history = history
        self._audit = audit

    def execute(
        self, *, user_id: str, actor_id: str,
        report_id: str | None = None, reason: str | None = None,
    ) -> None:
        self._gateway.block(user_id, reason=reason)
        self._record(
            report_id=report_id or "",
            actor_id=actor_id,
            action="moderation.user.block",
            resource="user",
            resource_id=user_id,
            note=reason,
        )


class UnblockUser(_Recorder):
    def __init__(
        self,
        gateway: UserBlockGateway,
        history: HistoryStore | None = None,
        audit: AuditRepository | None = None,
    ) -> None:
        self._gateway = gateway
        self._history = history
        self._audit = audit

    def execute(self, *, user_id: str, actor_id: str, report_id: str | None = None) -> None:
        self._gateway.unblock(user_id)
        self._record(
            report_id=report_id or "",
            actor_id=actor_id,
            action="moderation.user.unblock",
            resource="user",
            resource_id=user_id,
        )
