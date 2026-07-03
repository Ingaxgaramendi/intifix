import type { Ubicacion } from "@/types/service"

export interface Especialidad {
  idEspecialidad: string
  nombre: string
  descripcion?: string
  /** Certificado que acredita la especialidad (solo en "mis especialidades"). */
  certificadoUrl?: string
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
  /** Bio / "Acerca de mí" del técnico (editable, opcional). */
  descripcion?: string
  /** Teléfono de contacto público (opcional). */
  telefonoContacto?: string
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
  fotoPerfilUrl?: string
  descripcion?: string
  telefonoContacto?: string
}

/** PATCH /api/v1/technicians/{idUsuario}/documentos — send only changed URLs. */
export interface UpdateDocumentosRequest {
  dniFrontalUrl?: string
  dniTraseroUrl?: string
  antecedentePenalUrl?: string
  certificadoTecnicoUrl?: string
}

/* ------------------------------- Agenda ---------------------------------- */

/** Weekly recurring schedule slot. diaSemana: 0=domingo … 6=sábado. */
export interface Horario {
  idHorario: string
  idUsuarioTecnico: string
  diaSemana: number
  horaInicio: string // "HH:mm"
  horaFin: string // "HH:mm"
  activo: boolean
  [key: string]: unknown
}

/** POST /api/v1/technicians/schedules */
export interface CreateHorarioRequest {
  idUsuarioTecnico: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  activo: boolean
}

/** PUT /api/v1/technicians/schedules/{idHorario} — all optional. */
export interface UpdateHorarioRequest {
  diaSemana?: number
  horaInicio?: string
  horaFin?: string
  activo?: boolean
}

/** Day-off / unavailability window (ISO datetimes). */
export interface ExcepcionHorario {
  idExcepcion: string
  idUsuarioTecnico: string
  fechaInicio: string // ISO
  fechaFin: string // ISO
  motivo: string
  [key: string]: unknown
}

/** POST /api/v1/technicians/schedule-exceptions */
export interface CreateExcepcionRequest {
  idUsuarioTecnico: string
  fechaInicio: string
  fechaFin: string
  motivo: string
}

/** Day-of-week labels, indexed 0=domingo … 6=sábado. */
export const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const
