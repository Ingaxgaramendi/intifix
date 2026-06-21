"""
Unit tests for the Users admin context.

The use cases depend only on the ``UserRepository`` port, so they are tested
against an in-memory fake — no HTTP, no Mongo, no microservices.
"""
from __future__ import annotations

from dataclasses import replace

from django.test import SimpleTestCase

from shared.domain.entities import AuditEvent, Page

from usuarios.application.dtos import ListUsersQuery
from usuarios.application.use_cases import (
    ActivateUser,
    BanUser,
    GetUser,
    ListUsers,
    SuspendUser,
)
from usuarios.domain.entities import User, UserRole, UserStatus
from usuarios.domain.exceptions import (
    InvalidStatusTransitionError,
    UserAlreadyInStatusError,
)
from usuarios.domain.ports import UserRepository


def _user(**overrides) -> User:
    base = User(
        id="u1",
        email="a@b.com",
        full_name="Ana Test",
        status=UserStatus.ACTIVE,
        role=UserRole.CLIENT,
    )
    return replace(base, **overrides)


class FakeUserRepository(UserRepository):
    def __init__(self, user: User) -> None:
        self._user = user
        self.list_kwargs: dict | None = None

    def list(self, **kwargs) -> Page[User]:
        self.list_kwargs = kwargs
        return Page(items=[self._user], total=1,
                    page=kwargs["page"], page_size=kwargs["page_size"])

    def get(self, user_id: str) -> User:
        return self._user

    def set_status(self, user_id: str, status: str) -> User:
        self._user = replace(self._user, status=UserStatus(status))
        return self._user


class RecordingAudit:
    def __init__(self) -> None:
        self.events: list[AuditEvent] = []

    def record(self, event: AuditEvent) -> None:
        self.events.append(event)


class ListUsersTests(SimpleTestCase):
    def test_forwards_filters_and_maps_to_dto(self) -> None:
        repo = FakeUserRepository(_user(role=UserRole.TECHNICIAN))
        page = ListUsers(repo).execute(
            ListUsersQuery(page=2, page_size=10, search="ana",
                           status="active", role="technician")
        )
        self.assertEqual(repo.list_kwargs["role"], "technician")
        self.assertEqual(repo.list_kwargs["search"], "ana")
        self.assertEqual(page.count, 1)
        self.assertEqual(page.results[0].role, "technician")  # DTO exposes str


class GetUserTests(SimpleTestCase):
    def test_returns_dto(self) -> None:
        dto = GetUser(FakeUserRepository(_user())).execute("u1")
        self.assertEqual(dto.status, "active")
        self.assertEqual(dto.email, "a@b.com")


class SuspendUserTests(SimpleTestCase):
    def test_active_user_can_be_suspended_and_audited(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.ACTIVE))
        audit = RecordingAudit()
        dto = SuspendUser(repo, audit).execute(user_id="u1", actor_id="admin", reason="spam")
        self.assertEqual(dto.status, "suspended")
        self.assertEqual(audit.events[0].action, "users.suspend")
        self.assertEqual(audit.events[0].metadata["reason"], "spam")

    def test_already_suspended_raises(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.SUSPENDED))
        with self.assertRaises(UserAlreadyInStatusError):
            SuspendUser(repo).execute(user_id="u1", actor_id="admin")

    def test_banned_user_cannot_be_suspended(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.BANNED))
        with self.assertRaises(InvalidStatusTransitionError):
            SuspendUser(repo).execute(user_id="u1", actor_id="admin")


class ActivateUserTests(SimpleTestCase):
    def test_suspended_user_can_be_reactivated(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.SUSPENDED))
        dto = ActivateUser(repo).execute(user_id="u1", actor_id="admin")
        self.assertEqual(dto.status, "active")

    def test_banned_user_cannot_be_reactivated(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.BANNED))
        with self.assertRaises(InvalidStatusTransitionError):
            ActivateUser(repo).execute(user_id="u1", actor_id="admin")


class BanUserTests(SimpleTestCase):
    def test_active_user_can_be_banned(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.ACTIVE))
        dto = BanUser(repo).execute(user_id="u1", actor_id="admin")
        self.assertEqual(dto.status, "banned")

    def test_suspended_user_can_be_banned(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.SUSPENDED))
        dto = BanUser(repo).execute(user_id="u1", actor_id="admin")
        self.assertEqual(dto.status, "banned")

    def test_already_banned_raises(self) -> None:
        repo = FakeUserRepository(_user(status=UserStatus.BANNED))
        with self.assertRaises(UserAlreadyInStatusError):
            BanUser(repo).execute(user_id="u1", actor_id="admin")

    def test_audit_failure_does_not_break_operation(self) -> None:
        class BrokenAudit:
            def record(self, event: AuditEvent) -> None:
                raise RuntimeError("mongo down")

        repo = FakeUserRepository(_user(status=UserStatus.ACTIVE))
        dto = BanUser(repo, BrokenAudit()).execute(user_id="u1", actor_id="admin")
        self.assertEqual(dto.status, "banned")  # operation still succeeds


class TransitionPolicyTests(SimpleTestCase):
    def test_policy_matrix(self) -> None:
        active = _user(status=UserStatus.ACTIVE)
        self.assertTrue(active.can_transition_to(UserStatus.SUSPENDED))
        self.assertTrue(active.can_transition_to(UserStatus.BANNED))
        banned = _user(status=UserStatus.BANNED)
        self.assertFalse(banned.can_transition_to(UserStatus.ACTIVE))
        self.assertFalse(banned.can_transition_to(UserStatus.SUSPENDED))
