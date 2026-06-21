/**
 * Field names below mirror the backend Java DTOs (API_REQUEST_BODIES). Response
 * objects may carry extra fields, hence the tolerant index signatures.
 */

export type EstadoServicio =
  | "PENDIENTE"
  | "COTIZANDO"
  | "ASIGNADO"
  | "EN_PROCESO"
  | "FINALIZADO"
  | "CANCELADO"
  | (string & {})

export type Modalidad = "EN_CASA_CLIENTE" | "EN_TALLER_TECNICO"
export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE"
export type EstadoCotizacion = "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "EXPIRADA"

export interface Servicio {
  idServicio: string
  titulo: string
  descripcion: string
  estado: EstadoServicio
  modalidad?: Modalidad
  prioridad?: Prioridad
  idCliente?: string
  idUbicacion?: string
  ubicacion?: Ubicacion
  presupuestoMaximo?: number
  fechaProgramada?: string
  fechaCreacion?: string
  // GET /services/{id}/detalle embeds these — no extra calls needed.
  cotizaciones?: Cotizacion[]
  evidencias?: Evidencia[]
  asignacion?: Asignacion
  calificacion?: Record<string, unknown> | null
  [key: string]: unknown
}

export interface Ubicacion {
  idUbicacion: string
  departamento?: string
  provincia?: string
  distrito?: string
  direccionTexto?: string
  referencia?: string
  latitud?: number
  longitud?: number
  [key: string]: unknown
}

/** POST /api/v1/services — idCliente is derived from the token by the backend. */
export interface CreateServiceRequest {
  idUbicacion: string
  titulo: string
  descripcion: string
  modalidad: Modalidad
  prioridad: Prioridad
  presupuestoMaximo?: number
  fechaProgramada: string
}

/** POST /api/v1/services/cotizaciones — sent by a TECNICO. */
export interface CreateCotizacionRequest {
  idServicio: string
  precio: number
  tiempoEstimado: string
  comentario?: string
}

export type TipoArchivo = "IMAGEN" | "VIDEO" | "PDF"

/** POST /api/v1/services/evidencias — backend stores the URL, not the binary. */
export interface CreateEvidenciaRequest {
  idServicio: string
  urlArchivo: string
  nombreArchivo: string
  tipoArchivo: TipoArchivo
  tamanoBytes?: number
  descripcion?: string
  subidoPor: string
}

export interface Cotizacion {
  idCotizacion: string
  idServicio: string
  idUsuarioTecnico?: string
  idTecnico?: string
  nombreTecnico?: string
  precio?: number
  monto?: number
  tiempoEstimado?: string
  comentario?: string
  mensaje?: string
  estado?: EstadoCotizacion
  calificacionTecnico?: number
  fechaCreacion?: string
  [key: string]: unknown
}

export interface Asignacion {
  idAsignacion: string
  idServicio: string
  idUsuarioTecnico?: string
  idTecnico?: string
  nombreTecnico?: string
  estado?: string
  fechaInicioEstimada?: string
  fechaFinEstimada?: string
  [key: string]: unknown
}

export interface Evidencia {
  idEvidencia: string
  idServicio: string
  tipoArchivo?: string
  urlArchivo?: string
  nombreArchivo?: string
  descripcion?: string
  fechaCreacion?: string
  [key: string]: unknown
}

/* ---- Tolerant accessors (handle alternate field names) ---- */
export const cotizacionMonto = (c: Cotizacion): number | undefined => c.precio ?? c.monto
export const cotizacionTecnicoId = (c: Cotizacion): string | undefined =>
  c.idUsuarioTecnico ?? c.idTecnico
export const cotizacionComentario = (c: Cotizacion): string | undefined => c.comentario ?? c.mensaje
export const servicioPresupuesto = (s: Servicio): number | undefined => s.presupuestoMaximo
export const servicioDireccion = (s: Servicio): string | undefined =>
  s.ubicacion?.direccionTexto ?? (s.direccion as string | undefined)
