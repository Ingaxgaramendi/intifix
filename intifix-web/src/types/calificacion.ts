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
  [key: string]: unknown
}

export interface Reputacion {
  idUsuarioTecnico?: string
  puntuacionPromedio?: number
  calificacionPromedio?: number
  totalCalificaciones?: number
  porcentajeRecomendacion?: number
  [key: string]: unknown
}

export const reputacionPromedio = (r?: Reputacion): number | undefined =>
  r?.puntuacionPromedio ?? r?.calificacionPromedio
