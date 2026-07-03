"""
Ports (interfaces) for the Technicians context.

The application layer depends only on this abstraction, never on the concrete
HTTP gateway. The Technicians Service gateway in the infrastructure layer
implements it (Dependency Inversion Principle).
"""
from __future__ import annotations

import abc

from shared.domain.entities import Page

from .entities import Technician, TechnicianDocument


class TechnicianRepository(abc.ABC):
    @abc.abstractmethod
    def list(
        self, *, page: int, page_size: int, search: str | None = None,
        status: str | None = None,
    ) -> Page[Technician]:
        ...

    @abc.abstractmethod
    def get(self, technician_id: str) -> Technician:
        ...

    @abc.abstractmethod
    def set_status(self, technician_id: str, status: str) -> Technician:
        ...

    @abc.abstractmethod
    def reactivate(self, technician_id: str) -> Technician:
        ...

    @abc.abstractmethod
    def list_documents(self, technician_id: str) -> list[TechnicianDocument]:
        ...
