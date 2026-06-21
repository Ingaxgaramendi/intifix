import { apiDelete, apiGet, apiPatch } from "@/lib/axios"
import type { Page, PageParams } from "@/types/api"

export interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  leida: boolean
  tipo?: string
  fechaCreacion?: string
  [key: string]: unknown
}

const toQuery = (p?: PageParams) => ({
  params: { page: p?.page ?? 0, size: p?.size ?? 20, ...(p?.sort ? { sort: p.sort } : {}) },
})

export const notificationsApi = {
  list: (p?: PageParams) => apiGet<Page<Notificacion>>("/api/v1/notifications", toQuery(p)),
  unread: () => apiGet<Notificacion[]>("/api/v1/notifications/no-leidas"),
  count: () => apiGet<number>("/api/v1/notifications/contador"),
  markRead: (id: string) => apiPatch<void>(`/api/v1/notifications/${id}/leer`),
  markAllRead: () => apiPatch<void>("/api/v1/notifications/leer-todas"),
  remove: (id: string) => apiDelete<void>(`/api/v1/notifications/${id}`),
}
