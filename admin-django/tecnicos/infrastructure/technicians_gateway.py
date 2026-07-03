"""
HTTP gateway to the backend's Technicians module — concrete
``TechnicianRepository`` (Anti-Corruption Layer).

Maps the backend (intifix-2026) contract into the panel's domain entities:
  * list    → GET   /api/v1/technicians                  (Spring Page)
  * get     → GET   /api/v1/technicians/{id}/detalle     (rich: docs, specialties)
  * approve → PATCH /api/v1/technicians/{id}/aprobar
  * reject  → PATCH /api/v1/technicians/{id}/rechazar
  * suspend → PATCH /api/v1/technicians/{id}/suspender
  * docs    → the four KYC URLs embedded in the *detalle* response
"""
from __future__ import annotations

from datetime import datetime

from shared.domain.entities import Page
from shared.domain.exceptions import GatewayError
from shared.infrastructure.http.base_gateway import BaseGateway

from ..domain.entities import (
    DocumentType,
    Technician,
    TechnicianDocument,
    TechnicianStatus,
)
from ..domain.ports import TechnicianRepository

# Backend approval state (Spanish enum names) → panel status.
_STATUS_MAP = {
    "PENDIENTE": TechnicianStatus.PENDING,
    "APROBADO": TechnicianStatus.APPROVED,
    "RECHAZADO": TechnicianStatus.REJECTED,
    "SUSPENDIDO": TechnicianStatus.SUSPENDED,
}
# Panel target status → backend moderation verb (no body).
_ACTION_VERB = {
    TechnicianStatus.APPROVED.value: "aprobar",
    TechnicianStatus.REJECTED.value: "rechazar",
    TechnicianStatus.SUSPENDED.value: "suspender",
}


class TechniciansGateway(BaseGateway, TechnicianRepository):
    service_name = "technicians"

    def list(
        self, *, page: int, page_size: int, search: str | None = None,
        status: str | None = None,
    ) -> Page[Technician]:
        params: dict = {"page": page - 1 if page > 0 else 0, "size": page_size}
        # Backend filters approved/pending via /buscar/estado; plain list otherwise.
        payload = super().get("/api/v1/technicians", params=params) or {}
        items = [self._to_entity(row) for row in payload.get("results", [])]
        return Page(
            items=items,
            total=payload.get("count", len(items)),
            page=page,
            page_size=page_size,
        )

    def get(self, technician_id: str) -> Technician:  # type: ignore[override]
        payload = super().get(f"/api/v1/technicians/{technician_id}/detalle")
        return self._to_entity(payload)

    def set_status(self, technician_id: str, status: str) -> Technician:
        verb = _ACTION_VERB.get(status)
        if verb is None:
            raise GatewayError(
                f"La transición de estado '{status}' no está disponible para técnicos.",
            )
        payload = self.patch(f"/api/v1/technicians/{technician_id}/{verb}")
        # Suspend endpoint returns ApiResponse<Void>; fetch fresh entity in that case.
        if payload is None:
            return self.get(technician_id)
        return self._to_entity(payload)

    def reactivate(self, technician_id: str) -> Technician:
        payload = self.patch(f"/api/v1/technicians/{technician_id}/reactivar")
        if payload is None:
            return self.get(technician_id)
        return self._to_entity(payload)

    def list_documents(self, technician_id: str) -> list[TechnicianDocument]:
        # KYC documents embedded in the technician's detalle response.
        d = super().get(f"/api/v1/technicians/{technician_id}/detalle") or {}
        pairs = [
            (DocumentType.DNI_FRONT, d.get("dniFrontalUrl"), None),
            (DocumentType.DNI_BACK, d.get("dniTraseroUrl"), None),
            (DocumentType.BACKGROUND_CHECK, d.get("antecedentePenalUrl"), None),
            (DocumentType.CERTIFICATE, d.get("certificadoTecnicoUrl"), None),
        ]
        docs = [
            TechnicianDocument(type=doc_type, url=url, verified=bool(url), label=label)
            for doc_type, url, label in pairs
            if url
        ]

        # Per-specialty certificates: each assigned specialty may have its own
        # Cloudinary certificate URL stored separately.
        try:
            specialties = (
                super().get(f"/api/v1/technicians/specialties/tecnico/{technician_id}") or []
            )
            if isinstance(specialties, list):
                for spec in specialties:
                    cert_url = spec.get("certificadoUrl")
                    if cert_url:
                        docs.append(TechnicianDocument(
                            type=DocumentType.CERTIFICATE,
                            url=cert_url,
                            verified=True,
                            label=spec.get("nombre") or "Especialidad",
                        ))
        except Exception:  # noqa: BLE001 — best-effort; never blocks the main docs
            pass

        return docs

    # -- Mapping -------------------------------------------------------------
    @staticmethod
    def _to_entity(row: dict) -> Technician:
        created = row.get("creadoEn") or row.get("created_at")
        # estadoUsuario (from UsuarioAuth) takes precedence: a SUSPENDIDO user
        # keeps estadoAprobacion=APROBADO in PerfilTecnico, so we must check
        # the auth-level estado first to correctly surface the suspended state.
        estado_usuario = row.get("estadoUsuario", "")
        if estado_usuario == "SUSPENDIDO":
            status = TechnicianStatus.SUSPENDED
        else:
            estado = row.get("estadoAprobacion") or row.get("status")
            status = _STATUS_MAP.get(estado, TechnicianStatus.PENDING)
        specialties = tuple(
            e.get("nombre", "") if isinstance(e, dict) else str(e)
            for e in (row.get("especialidades") or ())
        )
        reputacion = row.get("reputacion") or {}
        return Technician(
            id=str(row.get("idUsuario") or row.get("id", "")),
            full_name=row.get("nombresCompletos") or row.get("full_name", ""),
            email=row.get("correo") or row.get("email", ""),
            status=status,
            specialties=specialties,
            phone=row.get("telefono") or row.get("phone"),
            rating=reputacion.get("promedioPuntuacion") if isinstance(reputacion, dict) else None,
            documents_complete=all(
                row.get(k) for k in ("dniFrontalUrl", "dniTraseroUrl")
            ),
            created_at=datetime.fromisoformat(created) if created else None,
        )
