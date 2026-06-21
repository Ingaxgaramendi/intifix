"""
Application use cases (services) for the Users context.

Each use case orchestrates the domain via the ``UserRepository`` port. They are
pure orchestration — no HTTP, no DRF, no ORM — which makes them trivially
unit-testable with a fake repository.

Status changes go through ``_TransitionUserStatus``, which enforces the domain
transition policy (``can_transition_to``) before touching the upstream service
and records an audit event afterwards. ``SuspendUser`` / ``ActivateUser`` /
``BanUser`` are intention-revealing specializations of it.
"""
from __future__ import annotations

import logging

from shared.domain.entities import AuditEvent, Page
from shared.infrastructure.mongo.audit_repository import AuditRepository

from ..domain.entities import User, UserStatus
from ..domain.exceptions import (
    InvalidStatusTransitionError,
    UserAlreadyInStatusError,
)
from ..domain.ports import UserRepository
from .dtos import ListUsersQuery, UserDTO, UserPageDTO

logger = logging.getLogger("intifix")

# Re-exported for backward compatibility with earlier imports.
__all__ = [
    "ListUsersQuery",
    "ListUsers",
    "GetUser",
    "SuspendUser",
    "ActivateUser",
    "BanUser",
]


class ListUsers:
    """List users with search, status and role filters."""

    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    def execute(self, query: ListUsersQuery) -> UserPageDTO:
        page: Page[User] = self._repository.list(
            page=query.page,
            page_size=query.page_size,
            search=query.search,
            status=query.status,
            role=query.role,
        )
        return UserPageDTO(
            results=[UserDTO.from_entity(u) for u in page.items],
            count=page.total,
            page=page.page,
            num_pages=page.num_pages,
        )


class GetUser:
    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    def execute(self, user_id: str) -> UserDTO:
        return UserDTO.from_entity(self._repository.get(user_id))


class _TransitionUserStatus:
    """Base use case: validate the transition, apply it, audit it."""

    #: Target status, set by each concrete subclass.
    target: UserStatus
    #: Audit action name, set by each concrete subclass.
    action: str

    def __init__(
        self,
        repository: UserRepository,
        audit: AuditRepository | None = None,
    ) -> None:
        self._repository = repository
        self._audit = audit

    def execute(self, *, user_id: str, actor_id: str, reason: str | None = None) -> UserDTO:
        current = self._repository.get(user_id)

        if current.status is self.target:
            raise UserAlreadyInStatusError(status=self.target)
        if not current.can_transition_to(self.target):
            raise InvalidStatusTransitionError(current=current.status, target=self.target)

        updated = self._repository.set_status(user_id, self.target.value)
        self._record_audit(user_id=user_id, actor_id=actor_id, reason=reason)
        return UserDTO.from_entity(updated)

    def _record_audit(self, *, user_id: str, actor_id: str, reason: str | None) -> None:
        if self._audit is None:
            return
        metadata = {"new_status": self.target.value}
        if reason:
            metadata["reason"] = reason
        try:
            self._audit.record(
                AuditEvent(
                    actor_id=actor_id,
                    action=self.action,
                    resource="user",
                    resource_id=user_id,
                    metadata=metadata,
                )
            )
        except Exception:  # noqa: BLE001 - audit must never break the operation
            # The upstream state change already succeeded; a failure to persist
            # the audit record is logged for follow-up but not surfaced.
            logger.exception("failed to record audit event action=%s user=%s",
                             self.action, user_id)


class SuspendUser(_TransitionUserStatus):
    target = UserStatus.SUSPENDED
    action = "users.suspend"


class ActivateUser(_TransitionUserStatus):
    target = UserStatus.ACTIVE
    action = "users.activate"


class BanUser(_TransitionUserStatus):
    target = UserStatus.BANNED
    action = "users.ban"
