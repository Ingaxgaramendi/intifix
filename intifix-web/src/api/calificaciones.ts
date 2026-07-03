import { apiGet, apiPost } from "@/lib/axios"
import type { Page, PageParams } from "@/types/api"
import type { Calificacion, CreateCalificacionRequest, Reputacion } from "@/types/calificacion"

const base = "/api/v1/services/calificaciones"
const pageParams = (p?: PageParams) => ({
  params: { page: p?.page ?? 0, size: p?.size ?? 10, ...(p?.sort ? { sort: p.sort } : {}) },
})

export const calificacionesApi = {
  crear: (body: CreateCalificacionRequest) => apiPost<Calificacion>(base, body),

  // May return a Page or a bare array — callers normalize with toItems().
  byTecnico: (idTec: string, p?: PageParams) =>
    apiGet<Page<Calificacion> | Calificacion[]>(`${base}/tecnico/${idTec}`, pageParams(p)),

  promedioPuntuacion: (idTec: string) =>
    apiGet<number | null>(`${base}/tecnico/${idTec}/promedio/puntuacion`),

  contarPorTecnico: (idTec: string) => apiGet<number>(`${base}/tecnico/${idTec}/count`),

  promedioPuntualidad: (idTec: string) =>
    apiGet<number>(`${base}/tecnico/${idTec}/promedio/puntualidad`),

  promedioProfesionalismo: (idTec: string) =>
    apiGet<number>(`${base}/tecnico/${idTec}/promedio/profesionalismo`),

  promedioCalidadTrabajo: (idTec: string) =>
    apiGet<number>(`${base}/tecnico/${idTec}/promedio/calidad-trabajo`),

  promedioComunicacion: (idTec: string) =>
    apiGet<number>(`${base}/tecnico/${idTec}/promedio/comunicacion`),

  porcentajeRecomendacion: (idTec: string) =>
    apiGet<number>(`${base}/tecnico/${idTec}/porcentaje-recomendacion`),

  /** Aggregate reputation snapshot. */
  reputation: (idTec: string) => apiGet<Reputacion>(`/api/v1/technicians/reputation/${idTec}`),
}
