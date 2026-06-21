"""Data Transfer Objects for the Moderation context (application I/O contracts)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..domain.entities import HistoryEntry, InternalComment, Report


@dataclass(slots=True)
class ListReportsQuery:
    page: int = 1
    page_size: int = 25
    status: str | None = None
    search: str | None = None


@dataclass(frozen=True, slots=True)
class ReportDTO:
    id: str
    reason: str
    status: str
    reported_user_id: str | None
    service_id: str | None
    reporter_id: str | None
    description: str
    created_at: datetime | None

    @classmethod
    def from_entity(cls, r: Report) -> "ReportDTO":
        return cls(
            id=r.id,
            reason=r.reason,
            status=r.status.value,
            reported_user_id=r.reported_user_id,
            service_id=r.service_id,
            reporter_id=r.reporter_id,
            description=r.description,
            created_at=r.created_at,
        )


@dataclass(frozen=True, slots=True)
class ReportPageDTO:
    results: list[ReportDTO]
    count: int
    page: int
    num_pages: int


@dataclass(frozen=True, slots=True)
class CommentDTO:
    report_id: str
    author_id: str
    body: str
    created_at: datetime | None

    @classmethod
    def from_entity(cls, c: InternalComment) -> "CommentDTO":
        return cls(report_id=c.report_id, author_id=c.author_id,
                   body=c.body, created_at=c.created_at)


@dataclass(frozen=True, slots=True)
class HistoryEntryDTO:
    report_id: str
    actor_id: str
    action: str
    from_status: str | None
    to_status: str | None
    note: str | None
    created_at: datetime | None

    @classmethod
    def from_entity(cls, e: HistoryEntry) -> "HistoryEntryDTO":
        return cls(
            report_id=e.report_id,
            actor_id=e.actor_id,
            action=e.action,
            from_status=e.from_status,
            to_status=e.to_status,
            note=e.note,
            created_at=e.created_at,
        )
