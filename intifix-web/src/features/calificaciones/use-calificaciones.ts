import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { calificacionesApi } from "@/api/calificaciones"
import { serviceKeys } from "@/features/services/use-services"
import { toItems } from "@/lib/list"
import type { CreateCalificacionRequest } from "@/types/calificacion"

export function useCrearCalificacion(idServicio: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCalificacionRequest) => calificacionesApi.crear(body),
    onSuccess: () => {
      // Detalle embeds calificacion — refetch to reflect the new review.
      qc.invalidateQueries({ queryKey: serviceKeys.detail(idServicio) })
      toast.success("¡Gracias por tu calificación!")
    },
  })
}

export function useReputacion(idTec: string | undefined) {
  return useQuery({
    queryKey: ["reputacion", idTec],
    queryFn: () => calificacionesApi.reputation(idTec!),
    enabled: !!idTec,
  })
}

export interface PromediosCategoria {
  puntualidad: number
  profesionalismo: number
  calidadTrabajo: number
  comunicacion: number
}

/** Fetches the four per-category score averages in parallel. */
export function usePromediosCategoria(idTec: string | undefined) {
  return useQuery({
    queryKey: ["promedios-categoria", idTec],
    queryFn: async (): Promise<PromediosCategoria> => {
      const [puntualidad, profesionalismo, calidadTrabajo, comunicacion] = await Promise.all([
        calificacionesApi.promedioPuntualidad(idTec!),
        calificacionesApi.promedioProfesionalismo(idTec!),
        calificacionesApi.promedioCalidadTrabajo(idTec!),
        calificacionesApi.promedioComunicacion(idTec!),
      ])
      return { puntualidad, profesionalismo, calidadTrabajo, comunicacion }
    },
    enabled: !!idTec,
  })
}

/**
 * Promedio de estrellas REAL del técnico (AVG en BD). Devuelve null si aún no
 * tiene calificaciones; nunca 0 (las estrellas van de 1 a 5). Preferible a la
 * reputación cacheada, que el backend no actualiza al calificar.
 */
export function usePromedioPuntuacion(idTec: string | undefined) {
  return useQuery({
    queryKey: ["promedio-puntuacion", idTec],
    queryFn: () => calificacionesApi.promedioPuntuacion(idTec!),
    enabled: !!idTec,
  })
}

/** Porcentaje de clientes que recomendarían al técnico (0–100). */
export function usePorcentajeRecomendacion(idTec: string | undefined) {
  return useQuery({
    queryKey: ["porcentaje-recomendacion", idTec],
    queryFn: () => calificacionesApi.porcentajeRecomendacion(idTec!),
    enabled: !!idTec,
  })
}

/** Total de calificaciones del técnico (conteo real en BD). */
export function useTotalCalificaciones(idTec: string | undefined) {
  return useQuery({
    queryKey: ["total-calificaciones", idTec],
    queryFn: () => calificacionesApi.contarPorTecnico(idTec!),
    enabled: !!idTec,
  })
}

export function useCalificacionesTecnico(idTec: string | undefined, page: number) {
  return useQuery({
    queryKey: ["calificaciones-tecnico", idTec, page],
    queryFn: async () => toItems(await calificacionesApi.byTecnico(idTec!, { page, size: 10 })),
    enabled: !!idTec,
  })
}
