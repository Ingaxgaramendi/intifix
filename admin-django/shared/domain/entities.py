"""
Domain primitives shared by every bounded context.

Entities here are plain, framework-agnostic dataclasses. They model the data
returned by the downstream microservices as understood by the admin domain,
deliberately decoupled from any ORM or DRF serializer (Dependency Inversion).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, TypeVar

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class Page(Generic[T]):
    """A page of results returned by a gateway, normalized for the panel."""

    items: list[T]
    total: int
    page: int
    page_size: int

    @property
    def num_pages(self) -> int:
        if self.page_size <= 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size


@dataclass(frozen=True, slots=True)
class AuditEvent:
    """An administrative action recorded to MongoDB for traceability."""

    actor_id: str
    action: str
    resource: str
    resource_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    request_id: str | None = None
