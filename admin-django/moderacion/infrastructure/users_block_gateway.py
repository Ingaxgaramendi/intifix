"""
HTTP gateway to the Users Service for block/unblock — concrete
``UserBlockGateway`` (Anti-Corruption Layer). User state is owned by the Users
Service; the panel only requests the block/unblock transition.
"""
from __future__ import annotations

from shared.infrastructure.http.base_gateway import BaseGateway

from ..domain.ports import UserBlockGateway as UserBlockPort


class UsersBlockGateway(BaseGateway, UserBlockPort):
    service_name = "users"

    def block(self, user_id: str, *, reason: str | None = None) -> None:
        body = {} if reason is None else {"reason": reason}
        self.patch(f"/api/v1/users/{user_id}/block", json=body)

    def unblock(self, user_id: str) -> None:
        self.patch(f"/api/v1/users/{user_id}/unblock", json={})
