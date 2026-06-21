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

export function useCalificacionesTecnico(idTec: string | undefined, page: number) {
  return useQuery({
    queryKey: ["calificaciones-tecnico", idTec, page],
    queryFn: async () => toItems(await calificacionesApi.byTecnico(idTec!, { page, size: 10 })),
    enabled: !!idTec,
  })
}
