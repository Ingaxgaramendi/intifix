"""Small REST helpers shared by the interface layers of every bounded context."""
from __future__ import annotations

from rest_framework.request import Request


def bearer_token(request: Request) -> str | None:
    """Extract the caller's JWT so gateways can forward it (on-behalf-of)."""
    header = request.headers.get("Authorization", "")
    return header[7:] if header.startswith("Bearer ") else None
