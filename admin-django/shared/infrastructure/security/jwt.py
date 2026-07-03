"""
Bearer-JWT decoder for tokens issued by the Intifix backend (Spring Boot).

The backend signs HS256 tokens with a shared secret and this contract:
  * ``sub``    — user id (UUID, as string)
  * ``correo`` — email
  * ``roles``  — list of role names (enum names, e.g. ["ADMIN"])
  * ``typ``    — "access" | "refresh"
  * ``iat`` / ``exp`` — issued-at / expiry  (no ``iss`` / ``aud``)

We decode directly with PyJWT (a simple-jwt dependency) instead of simple-jwt's
``AccessToken``, because that class enforces its own claim names (``token_type``)
and would reject the backend's tokens. This is the Anti-Corruption boundary for
authentication.
"""
from __future__ import annotations

import jwt
from django.conf import settings

ACCESS = "access"
REFRESH = "refresh"


def decode_bearer(raw: str) -> dict | None:
    """Verify signature + expiry and return the claims, or ``None`` if invalid."""
    cfg = settings.SIMPLE_JWT
    try:
        return jwt.decode(
            raw,
            cfg["SIGNING_KEY"],
            algorithms=[cfg["ALGORITHM"]],
            # The backend does not set iss/aud; verify signature + exp only.
            options={"verify_aud": False, "verify_iss": False, "require": ["exp"]},
        )
    except jwt.PyJWTError:
        return None


def is_access_token(claims: dict) -> bool:
    """Whether the token is an access token (refresh tokens carry ``typ=refresh``)."""
    return claims.get("typ", ACCESS) == ACCESS
