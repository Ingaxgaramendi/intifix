"""
Data Transfer Objects for the Users context.

DTOs are the application layer's input/output contracts. They keep the domain
entities free of presentation concerns and give the interface layer a stable
shape to serialize — the view never touches a domain ``User`` directly.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from ..domain.entities import User


@dataclass(slots=True)
class ListUsersQuery:
    """Input for the ListUsers use case (search + filters + pagination)."""

    page: int = 1
    page_size: int = 25
    search: str | None = None
    status: str | None = None
    role: str | None = None


@dataclass(frozen=True, slots=True)
class UserDTO:
    """Output representation of a user for the admin panel."""

    id: str
    email: str
    full_name: str
    status: str
    role: str
    phone: str | None
    is_verified: bool
    created_at: datetime | None

    @classmethod
    def from_entity(cls, user: User) -> "UserDTO":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            status=user.status.value,
            role=user.role.value,
            phone=user.phone,
            is_verified=user.is_verified,
            created_at=user.created_at,
        )


@dataclass(frozen=True, slots=True)
class UserPageDTO:
    """A paginated page of users, ready for the list endpoint envelope."""

    results: list[UserDTO]
    count: int
    page: int
    num_pages: int
