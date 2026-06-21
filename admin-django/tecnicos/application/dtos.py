"""Data Transfer Objects for the Technicians context (application I/O contracts)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..domain.entities import Technician, TechnicianDocument


@dataclass(slots=True)
class ListTechniciansQuery:
    page: int = 1
    page_size: int = 25
    search: str | None = None
    status: str | None = None


@dataclass(frozen=True, slots=True)
class TechnicianDTO:
    id: str
    full_name: str
    email: str
    status: str
    specialties: list[str]
    phone: str | None
    rating: float | None
    documents_complete: bool
    created_at: datetime | None

    @classmethod
    def from_entity(cls, t: Technician) -> "TechnicianDTO":
        return cls(
            id=t.id,
            full_name=t.full_name,
            email=t.email,
            status=t.status.value,
            specialties=list(t.specialties),
            phone=t.phone,
            rating=t.rating,
            documents_complete=t.documents_complete,
            created_at=t.created_at,
        )


@dataclass(frozen=True, slots=True)
class TechnicianPageDTO:
    results: list[TechnicianDTO]
    count: int
    page: int
    num_pages: int


@dataclass(frozen=True, slots=True)
class TechnicianDocumentDTO:
    type: str
    url: str
    verified: bool
    uploaded_at: datetime | None

    @classmethod
    def from_entity(cls, doc: TechnicianDocument) -> "TechnicianDocumentDTO":
        return cls(
            type=doc.type.value,
            url=doc.url,
            verified=doc.verified,
            uploaded_at=doc.uploaded_at,
        )
