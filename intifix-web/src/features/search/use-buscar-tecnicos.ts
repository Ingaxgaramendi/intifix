import { useQuery } from "@tanstack/react-query"
import { techniciansApi } from "@/api/technicians"
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
