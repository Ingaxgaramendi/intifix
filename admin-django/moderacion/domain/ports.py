"""
Ports (interfaces) for the Moderation context.

The application layer depends only on these abstractions:
  * ``ReportRepository``  — backed by the Services Service (reports live there).
  * ``UserBlockGateway``  — backed by the Users Service (block/unblock).
  * ``CommentStore``      — panel-owned MongoDB collection (internal comments).
  * ``HistoryStore``      — panel-owned MongoDB collection (moderation history).

Concrete adapters in the infrastructure layer implement them (Dependency
Inversion Principle), keeping use cases trivially unit-testable with fakes.
"""
from __future__ import annotations

import abc

from shared.domain.entities import Page

from .entities import HistoryEntry, InternalComment, Report


class ReportRepository(abc.ABC):
    @abc.abstractmethod
    def list(
        self, *, page: int, page_size: int, status: str | None = None,
        search: str | None = None,
    ) -> Page[Report]:
        ...

    @abc.abstractmethod
    def get(self, report_id: str) -> Report:
        ...

    @abc.abstractmethod
    def set_status(self, report_id: str, status: str) -> Report:
        ...


class UserBlockGateway(abc.ABC):
    @abc.abstractmethod
    def block(self, user_id: str, *, reason: str | None = None) -> None:
        ...

    @abc.abstractmethod
    def unblock(self, user_id: str) -> None:
        ...


class CommentStore(abc.ABC):
    @abc.abstractmethod
    def add(self, comment: InternalComment) -> InternalComment:
        ...

    @abc.abstractmethod
    def list(self, report_id: str) -> list[InternalComment]:
        ...


class HistoryStore(abc.ABC):
    @abc.abstractmethod
    def append(self, entry: HistoryEntry) -> None:
        ...

    @abc.abstractmethod
    def list(self, report_id: str) -> list[HistoryEntry]:
        ...
