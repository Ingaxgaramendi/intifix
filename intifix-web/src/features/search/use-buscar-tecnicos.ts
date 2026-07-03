import { useMemo } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { apiGet } from "@/lib/axios"
import { techniciansApi } from "@/api/technicians"
import { ubicacionesApi } from "@/api/ubicaciones"
import { toItems } from "@/lib/list"
import type { Disponibilidad } from "@/types/technician"

export interface TecnicoFilters {
  idEspecialidad?: string
  disponibilidad?: Disponibilidad | "TODOS"
}

/**
 * Picks the right backend endpoint from the active filters: specialty search
 * takes priority; otherwise we list by availability. Results are normalized to
 * a plain array regardless of Page/array shape.
 */
export function useBuscarTecnicos(filters: TecnicoFilters) {
  return useQuery({
    queryKey: ["buscar-tecnicos", filters],
    queryFn: async () => {
      if (filters.idEspecialidad) {
        return toItems(await techniciansApi.buscarPorEspecialidad(filters.idEspecialidad))
      }
      const disp = filters.disponibilidad && filters.disponibilidad !== "TODOS"
        ? filters.disponibilidad
        : "DISPONIBLE"
      return toItems(await techniciansApi.buscarPorDisponibilidad(disp))
    },
  })
}

export function useTecnicoDetalle(id: string | null) {
  return useQuery({
    queryKey: ["tecnico-detalle", id],
    queryFn: () => techniciansApi.detalle(id!),
    enabled: !!id,
  })
}

/**
 * Batch-fetches ubicaciones (lat/lng) for a list of idUbicacion UUIDs.
 * Returns a Map<idUbicacion, {lat, lng}> so the map can display markers even
 * when the list endpoint only returns idUbicacion (not the full nested object).
 */
export function useUbicaciones(
  ids: (string | undefined)[],
): Map<string, { lat: number; lng: number }> {
  const uniqueIds = useMemo(
    () => [...new Set(ids.filter((id): id is string => !!id))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join(",")],
  )

  const results = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["ubicacion", id],
      queryFn: () => ubicacionesApi.get(id),
      staleTime: 10 * 60_000,
      retry: false,
    })),
  })

  return useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>()
    uniqueIds.forEach((id, i) => {
      const d = results[i]?.data
      if (d?.latitud != null && d?.longitud != null) {
        map.set(id, { lat: Number(d.latitud), lng: Number(d.longitud) })
      }
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueIds.join(","), results.map((r) => r.dataUpdatedAt).join(",")])
}

export interface TecnicoReputacion {
  rating?: number
  totalResenas?: number
}

/**
 * Rating real (AVG en BD) y nº de reseñas de varios técnicos a la vez. El listado
 * NO trae el rating y la reputación cacheada queda en 0, así que usamos el promedio
 * computado (`/promedio/puntuacion`, null o ≥1) y el conteo. Tolera errores sin toast.
 */
export function useReputaciones(ids: string[]): Map<string, TecnicoReputacion> {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["tecnico-rating", id],
      retry: false,
      staleTime: 60_000,
      queryFn: async (): Promise<TecnicoReputacion> => {
        const [rating, total] = await Promise.all([
          apiGet<number | null>(`/api/v1/services/calificaciones/tecnico/${id}/promedio/puntuacion`, {
            skipErrorToast: true,
          }).catch(() => null),
          apiGet<number | null>(`/api/v1/services/calificaciones/tecnico/${id}/count`, {
            skipErrorToast: true,
          }).catch(() => null),
        ])
        return { rating: rating ?? undefined, totalResenas: total ?? undefined }
      },
    })),
  })

  return useMemo(() => {
    const m = new Map<string, TecnicoReputacion>()
    ids.forEach((id, i) => {
      const r = results[i]?.data
      if (r) m.set(id, r)
    })
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(","), results.map((r) => r.dataUpdatedAt).join(",")])
}
