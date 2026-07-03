"""
HTTP gateway to the Users Service — concrete implementation of the
``UserRepository`` port (Anti-Corruption Layer).

It is the only place that knows the wire format of the Users Service; it maps
upstream JSON into domain ``User`` entities so nothing downstream is coupled to
that contract.
"""
from __future__ import annotations

import dataclasses
from datetime import datetime

from shared.domain.entities import Page
from shared.domain.exceptions import GatewayError
from shared.infrastructure.http.base_gateway import BaseGateway

from ..domain.entities import User, UserRole, UserStatus
from ..domain.ports import UserRepository

# Domain status values (lowercase) → Spring Boot EstadoUsuario (uppercase Spanish).
_STATUS_TO_BACKEND: dict[str, str] = {
    UserStatus.ACTIVE.value: "ACTIVO",
    UserStatus.SUSPENDED.value: "SUSPENDIDO",
    UserStatus.BANNED.value: "BANEADO",
    UserStatus.PENDING.value: "PENDIENTE",
}

# Spring Boot EstadoUsuario → domain UserStatus.
_ESTADO_USUARIO_MAP: dict[str, UserStatus] = {
    "ACTIVO": UserStatus.ACTIVE,
    "SUSPENDIDO": UserStatus.SUSPENDED,
    "BANEADO": UserStatus.BANNED,
}


class UsersGateway(BaseGateway, UserRepository):
    service_name = "users"

    def list(
        self, *, page: int, page_size: int, search: str | None = None,
        status: str | None = None, role: str | None = None,
    ) -> Page[User]:
        # Backend pagination is 0-based with a ``size`` param.
        # Spring's /api/v1/clientes supports only Pageable (page/size/sort).
        # Status and role filtering are not available upstream; those params are ignored.
        params: dict = {"page": page - 1 if page > 0 else 0, "size": page_size}

        if search:
            # Spring exposes a separate search endpoint that accepts ?nombre=X
            payload = super().get("/api/v1/clientes/buscar", params={**params, "nombre": search}) or {}
        else:
            payload = super().get("/api/v1/clientes", params=params) or {}
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
        backend_status = _STATUS_TO_BACKEND.get(status)
        if backend_status is None:
            raise GatewayError(f"Estado '{status}' no reconocido por el gateway.")
        self.patch(
            f"/api/v1/auth/usuarios/{user_id}/estado",
            json={"estado": backend_status},
        )
        # The auth endpoint returns void; rebuild the User with the new status
        # from the client profile data + the applied status override.
        user = self.get(user_id)
        new_status = _coerce(UserStatus, status, UserStatus.ACTIVE)
        return dataclasses.replace(user, status=new_status)

    # -- Mapping -------------------------------------------------------------
    @staticmethod
    def _to_entity(row: dict) -> User:
        # Map the backend's Cliente shape.
        # ClienteResponse fields: idUsuario, nombresCompletos, dniRuc,
        #   fotoPerfilUrl, idUbicacion, creadoEn.
        # Email is not included — it lives in the auth/identity module, not
        # in the clientes module. The panel shows the id as a secondary line.
        # Verification = client has registered their DNI/RUC document.
        created = row.get("creadoEn") or row.get("created_at")
        # tieneDniRuc comes from ClienteDetalleResponse; dniRuc from ClienteResponse.
        is_verified = bool(
            row.get("tieneDniRuc")       # boolean field in detalle endpoint
            or row.get("dniRuc")         # raw value in list endpoint (truthy = has doc)
            or row.get("is_verified")
        )
        # estadoUsuario is set by Spring Boot from the auth module (UsuarioAuth.estado).
        # Fall back to the legacy "status" field for any older responses.
        status = (
            _ESTADO_USUARIO_MAP.get(row.get("estadoUsuario", ""))
            or _coerce(UserStatus, row.get("status"), UserStatus.ACTIVE)
        )
        return User(
            id=str(row.get("idUsuario") or row.get("id", "")),
            email=row.get("correo") or row.get("email", ""),
            full_name=(
                row.get("nombresCompletos")
                or row.get("full_name")
                or row.get("name", "")
            ),
            status=status,
            role=_coerce(UserRole, row.get("role"), UserRole.CLIENT),
            phone=row.get("telefono") or row.get("phone"),
            is_verified=is_verified,
            created_at=datetime.fromisoformat(created) if created else None,
        )


def _coerce(enum_cls, value, default):  # noqa: ANN001
    """Map an upstream string into our enum, tolerating unknown values."""
    try:
        return enum_cls(value)
    except ValueError:
        return default
