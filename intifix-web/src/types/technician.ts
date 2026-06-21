import type { Ubicacion } from "@/types/service"

export interface Especialidad {
  idEspecialidad: string
  nombre: string
  descripcion?: string
  [key: string]: unknown
}

export type Disponibilidad = "DISPONIBLE" | "OCUPADO"
export type EstadoAprobacion = "PENDIENTE" | "APROBADO" | "RECHAZADO"

export interface Tecnico {
  idUsuario: string
  nombresCompletos?: string
  nombre?: string
  correo?: string
  dniRuc?: string
  experienciaAnios?: number
  fotoPerfilUrl?: string
  tarifaBase?: number
  disponibilidad?: Disponibilidad
  estadoAprobacion?: EstadoAprobacion
  especialidades?: Array<string | Especialidad>
  calificacion?: number
  calificacionPromedio?: number
  totalServicios?: number
  idUbicacion?: string
  ubicacion?: Ubicacion
  latitud?: number
  longitud?: number
  [key: string]: unknown
}

/* ---- Tolerant accessors ---- */
export const tecnicoNombre = (t: Tecnico): string =>
  t.nombresCompletos ?? t.nombre ?? t.correo ?? "Técnico"

export const tecnicoTarifa = (t: Tecnico): number | undefined => t.tarifaBase

export const tecnicoCalificacion = (t: Tecnico): number | undefined =>
  t.calificacion ?? t.calificacionPromedio

export const tecnicoCoords = (t: Tecnico): { lat: number; lng: number } | null => {
  const lat = t.latitud ?? t.ubicacion?.latitud
  const lng = t.longitud ?? t.ubicacion?.longitud
  return lat != null && lng != null ? { lat, lng } : null
}

export const tecnicoEspecialidades = (t: Tecnico): string[] =>
  (t.especialidades ?? []).map((e) => (typeof e === "string" ? e : e.nombre))

/** PUT /api/v1/technicians/{idUsuario} — all optional. */
export interface UpdateTecnicoRequest {
  nombresCompletos?: string
  dniRuc?: string
  experienciaAnios?: number
  tarifaBase?: number
  disponibilidad?: Disponibilidad
}

/** PATCH /api/v1/technicians/{idUsuario}/documentos — send only changed URLs. */
export interface UpdateDocumentosRequest {
  dniFrontalUrl?: string
  dniTraseroUrl?: string
  antecedentePenalUrl?: string
  certificadoTecnicoUrl?: string
}
