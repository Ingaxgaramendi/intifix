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

export type TipoSolicitud = "PUBLICA" | "DIRECTA"
export type TipoFecha = "URGENTE" | "EXACTA" | "RANGO"

export type Modalidad = "EN_CASA_CLIENTE" | "EN_TALLER_TECNICO"
export type EstadoCotizacion = "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "EXPIRADA"

export interface Servicio {
  idServicio: string
  titulo: string
  descripcion: string
  /** Fotos del servicio (URLs en Cloudinary), 1 a 5. */
  fotos?: string[]
  estado: EstadoServicio
  modalidad?: Modalidad
  tipoSolicitud?: TipoSolicitud
  idTecnicoDirecto?: string
  idCliente?: string
  /** Nombre del cliente (lo envía el backend en el listado de disponibles). */
  nombreCliente?: string
  idUbicacion?: string
  idEspecialidad?: string
  ubicacion?: Ubicacion
  presupuestoMaximo?: number
  tipoFecha?: TipoFecha
  fechaProgramada?: string
  fechaInicioRango?: string
  fechaFinRango?: string
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
  /** Solo para EN_CASA_CLIENTE; en taller no se envía. */
  idUbicacion?: string
  idEspecialidad: string
  titulo: string
  descripcion: string
  modalidad: Modalidad
  presupuestoMaximo?: number
  /** Scheduling mode; defaults to EXACTA. */
  tipoFecha: TipoFecha
  /** Required for EXACTA mode. */
  fechaProgramada?: string
  /** Required for RANGO mode: start of window. */
  fechaInicioRango?: string
  /** Required for RANGO mode: end of window (max 5 days). */
  fechaFinRango?: string
  /** 1 a 5 URLs de fotos (Cloudinary). */
  fotos: string[]
  tipoSolicitud?: TipoSolicitud
  idTecnicoDirecto?: string
}

/** POST /api/v1/services/cotizaciones — sent by a TECNICO. */
export interface CreateCotizacionRequest {
  idServicio: string
  precio: number
  tiempoEstimado: string
  comentario?: string
  /** ISO UTC string. Required by backend for URGENTE (today/tomorrow) and RANGO (within client's window). */
  fechaPropuesta?: string
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
  /** Fecha y hora propuesta por el técnico (URGENTE y RANGO). */
  fechaPropuesta?: string
  fechaCreacion?: string
  fechaEnvio?: string
  fechaRespuesta?: string
  fechaExpiracion?: string
  motivoRechazo?: string
  [key: string]: unknown
}

export interface Asignacion {
  idAsignacion: string
  idServicio: string
  idUsuarioTecnico?: string
  idTecnico?: string
  nombreTecnico?: string
  /** Enriquecidos por el backend desde la tabla servicios/usuarios. */
  tituloServicio?: string
  idCliente?: string
  nombreCliente?: string
  estado?: string
  estadoServicio?: string
  idCotizacion?: string
  fechaAsignacion?: string
  fechaInicioEstimada?: string
  fechaFinEstimada?: string
  fechaInicioReal?: string
  fechaFinReal?: string
  notasTecnico?: string
  [key: string]: unknown
}

export const asignacionEstado = (a: Asignacion): string =>
  a.estado ?? a.estadoServicio ?? ""

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
