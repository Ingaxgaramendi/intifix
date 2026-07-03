/** POST /api/v1/services/calificaciones — all scores 1-5. */
export interface CreateCalificacionRequest {
  idServicio: string
  puntuacion: number
  comentario?: string
  puntualidad?: number
  profesionalismo?: number
  calidadTrabajo?: number
  comunicacion?: number
  recomendaria?: boolean
  aspectosPositivos?: string[]
  aspectosMejorar?: string[]
}

export interface Calificacion {
  idCalificacion?: string
  idServicio: string
  /** Autor de la reseña; el backend no manda el nombre, se resuelve por este id. */
  idCliente?: string
  idUsuarioTecnico?: string
  puntuacion: number
  comentario?: string
  puntualidad?: number
  profesionalismo?: number
  calidadTrabajo?: number
  comunicacion?: number
  recomendaria?: boolean
  aspectosPositivos?: string[]
  aspectosMejorar?: string[]
  nombreCliente?: string
  fechaCreacion?: string
  /** Nombre real del campo de fecha en el backend (CalificacionResponse). */
  fechaCalificacion?: string
  [key: string]: unknown
}

/** GET /api/v1/technicians/reputation/{id} — nombres reales del ReputacionResponse. */
export interface Reputacion {
  idUsuarioTecnico?: string
  /** Promedio de estrellas mantenido por el backend. */
  promedioCalificacion?: number
  totalResenas?: number
  totalServicios?: number
  actualizadoEn?: string
  // Nombres alternativos tolerados (compat con respuestas antiguas).
  puntuacionPromedio?: number
  calificacionPromedio?: number
  totalCalificaciones?: number
  porcentajeRecomendacion?: number
  [key: string]: unknown
}

export const reputacionPromedio = (r?: Reputacion): number | undefined =>
  r?.promedioCalificacion ?? r?.puntuacionPromedio ?? r?.calificacionPromedio

/** Nº total de reseñas, tolerando nombres alternativos del backend. */
export const reputacionTotalResenas = (r?: Reputacion): number | undefined =>
  r?.totalResenas ?? r?.totalCalificaciones
