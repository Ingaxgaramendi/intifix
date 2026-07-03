import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "@/api/notifications"

export const NOTIF_KEY = ["notifications"] as const

export function useNotificaciones(page: number) {
  return useQuery({
    queryKey: ["notifications", "list", page],
    // El backend ordena por `creadoEn` (no `fechaCreacion`): un sort inválido es 500.
    queryFn: () => notificationsApi.list({ page, size: 20, sort: "creadoEn,desc" }),
  })
}

/** Contador para el badge de la campana. Extrae `noLeidas` del objeto. */
export function useContadorNoLeidas() {
  return useQuery({
    queryKey: ["notifications", "count"],
    queryFn: notificationsApi.count,
    select: (data) => data.noLeidas,
    // Fallback por si el WebSocket de push no está disponible.
    refetchInterval: 60_000,
  })
}

// Refresh both the list and the bell counter after any change.
function useInvalidateNotifs() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: NOTIF_KEY })
}

export function useMarcarLeida() {
  const invalidate = useInvalidateNotifs()
  return useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id), onSuccess: invalidate })
}

export function useMarcarTodas() {
  const invalidate = useInvalidateNotifs()
  return useMutation({ mutationFn: () => notificationsApi.markAllRead(), onSuccess: invalidate })
}

export function useEliminarNotif() {
  const invalidate = useInvalidateNotifs()
  return useMutation({ mutationFn: (id: string) => notificationsApi.remove(id), onSuccess: invalidate })
}
