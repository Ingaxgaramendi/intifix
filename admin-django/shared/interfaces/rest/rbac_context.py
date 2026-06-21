"""
Current-principal context.

The RBAC middleware resolves the authenticated principal once per request and
stashes it here so any layer (decorators, audit, services) can read *who* is
acting without re-parsing the JWT or threading the request through.
"""
from __future__ import annotations

from contextvars import ContextVar

from shared.domain.rbac import ANONYMOUS, Principal

_principal: ContextVar[Principal] = ContextVar("principal", default=ANONYMOUS)


def set_principal(principal: Principal) -> None:
    _principal.set(principal)


def current_principal() -> Principal:
    return _principal.get()


def clear_principal() -> None:
    _principal.set(ANONYMOUS)
