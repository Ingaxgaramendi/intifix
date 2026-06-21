"""
Ports (interfaces) for the Users context.

The application layer depends on this abstraction, never on the concrete
gateway. The HTTP gateway in the infrastructure layer implements it
(Dependency Inversion Principle).
"""
from __future__ import annotations

import abc

from shared.domain.entities import Page

from .entities import User


class UserRepository(abc.ABC):
    @abc.abstractmethod
    def list(
        self, *, page: int, page_size: int, search: str | None = None,
        status: str | None = None, role: str | None = None,
    ) -> Page[User]:
        ...

    @abc.abstractmethod
    def get(self, user_id: str) -> User:
        ...

    @abc.abstractmethod
    def set_status(self, user_id: str, status: str) -> User:
        ...
