"""
HTTP gateway to the Users Service — concrete implementation of the
``UserRepository`` port (Anti-Corruption Layer).

It is the only place that knows the wire format of the Users Service; it maps
upstream JSON into domain ``User`` entities so nothing downstream is coupled to
that contract.
"""
from __future__ import annotations

from datetime import datetime

from shared.domain.entities import Page
from shared.infrastructure.http.base_gateway import BaseGateway

from ..domain.entities import User, UserRole, UserStatus
from ..domain.ports import UserRepository


class UsersGateway(BaseGateway, UserRepository):
    service_name = "users"

    def list(
        self, *, page: int, page_size: int, search: str | None = None,
        status: str | None = None, role: str | None = None,
    ) -> Page[User]:
        params = {"page": page, "page_size": page_size}
        if search:
            params["search"] = search
        if status:
            params["status"] = status
        if role:
            params["role"] = role

        payload = self.get("/api/v1/clientes", params=params) or {}
        items = [self._to_entity(row) for row in payload.get("results", [])]
        return Page(
            items=items,
            total=payload.get("count", len(items)),
            page=page,
            page_size=page_size,
        )

    def get(self, user_id: str) -> User:  # type: ignore[override]
        payload = super().get(f"/api/v1/clientes/{user_id}")
        return self._to_entity(payload)

    def set_status(self, user_id: str, status: str) -> User:
        payload = self.patch(f"/api/v1/clientes/{user_id}", json={"status": status})
        return self._to_entity(payload)

    # -- Mapping -------------------------------------------------------------
    @staticmethod
    def _to_entity(row: dict) -> User:
        created = row.get("created_at")
        return User(
            id=str(row["id"]),
            email=row.get("email", ""),
            full_name=row.get("full_name") or row.get("name", ""),
            status=_coerce(UserStatus, row.get("status"), UserStatus.PENDING),
            role=_coerce(UserRole, row.get("role"), UserRole.CLIENT),
            phone=row.get("phone"),
            is_verified=bool(row.get("is_verified", False)),
            created_at=datetime.fromisoformat(created) if created else None,
        )


def _coerce(enum_cls, value, default):  # noqa: ANN001
    """Map an upstream string into our enum, tolerating unknown values."""
    try:
        return enum_cls(value)
    except ValueError:
        return default
