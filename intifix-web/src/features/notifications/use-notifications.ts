import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "@/api/notifications"

export function useNotificaciones(page: number) {
  return useQuery({
    queryKey: ["notifications", "list", page],
    queryFn: () => notificationsApi.list({ page, size: 20, sort: "fechaCreacion,desc" }),
  })
}

// Refresh both the list and the bell counter after any change.
function useInvalidateNotifs() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ["notifications"] })
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
