"""
Domain & application exceptions.

These are framework-agnostic. The REST layer translates them into HTTP
responses in ``shared.interfaces.rest.exception_handler`` (Separation of
Concerns: the domain never imports DRF).
"""
from __future__ import annotations


class DomainError(Exception):
    """Base class for all expected, business-level errors."""

    default_message = "A domain error occurred."
    status_code = 400
    code = "domain_error"

    def __init__(self, message: str | None = None, *, details: dict | None = None):
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)


class EntityNotFoundError(DomainError):
    default_message = "The requested resource was not found."
    status_code = 404
    code = "not_found"


class ValidationError(DomainError):
    default_message = "The submitted data is invalid."
    status_code = 422
    code = "validation_error"


class PermissionDeniedError(DomainError):
    default_message = "You are not allowed to perform this action."
    status_code = 403
    code = "permission_denied"


# --- Infrastructure-level errors (gateways) ---------------------------------
class GatewayError(DomainError):
    """A downstream microservice call failed in a way the panel can surface."""

    default_message = "An upstream service is currently unavailable."
    status_code = 502
    code = "gateway_error"


class GatewayTimeoutError(GatewayError):
    default_message = "An upstream service timed out."
    status_code = 504
    code = "gateway_timeout"


class GatewayUnauthorizedError(GatewayError):
    default_message = "Authentication against an upstream service failed."
    status_code = 502
    code = "gateway_unauthorized"
