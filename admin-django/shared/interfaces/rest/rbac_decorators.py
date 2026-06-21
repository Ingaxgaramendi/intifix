"""
``@require_permission`` / ``@require_role`` decorators for DRF view handlers.

Use these for **method-level** authorization where a single view serves
multiple verbs with different requirements (e.g. GET vs POST on the same URL),
which DRF's view-level ``permission_classes`` cannot express. They enforce
*before* the handler runs and raise ``PermissionDeniedError`` (HTTP 403) — the
shared exception handler renders the standard error envelope.
"""
from __future__ import annotations

from functools import wraps

from shared.domain.exceptions import PermissionDeniedError
from shared.domain.rbac import Permission
from shared.interfaces.rest.permissions import _roles_from_request, principal_has


def require_permission(*permissions: Permission, require_all: bool = True):
    """Require the caller to hold the given permission(s) for this handler."""

    def decorator(func):  # noqa: ANN001
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):  # noqa: ANN001
            if not principal_has(request, *permissions, require_all=require_all):
                raise PermissionDeniedError(
                    "You lack the required permission for this action.",
                    details={"required": [p.value for p in permissions]},
                )
            return func(self, request, *args, **kwargs)

        return wrapper

    return decorator


def require_role(*roles: str):
    """Require the caller to carry one of the given roles for this handler."""

    def decorator(func):  # noqa: ANN001
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):  # noqa: ANN001
            have = set(_roles_from_request(request))
            if not (have & set(roles)):
                raise PermissionDeniedError(
                    "Your role is not allowed to perform this action.",
                    details={"required_roles": list(roles)},
                )
            return func(self, request, *args, **kwargs)

        return wrapper

    return decorator
