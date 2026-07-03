import { apiDelete, apiGet, apiPatch } from "@/lib/axios"
import type { Page, PageParams } from "@/types/api"

/** Categoría de la notificación (espejo del enum del backend). */
export type TipoNotificacion =
  | "MENSAJE_NUEVO"
  | "MENSAJE_LEIDO"
  | "CONVERSACION_BLOQUEADA"
  | "SERVICIO"
  | "PAGO"
  | "SISTEMA"

/** Forma EXACTA del NotificacionResponse del backend. */
export interface Notificacion {
  id: string
  idDestinatario: string
  tipo: TipoNotificacion
  titulo: string
  cuerpo: string
  referenciaId?: string | null
  leida: boolean
  leidoEn?: string | null
  creadoEn: string
}

/** El endpoint /contador devuelve un objeto, no un número plano. */
export interface ContadorNoLeidas {
  noLeidas: number
}

const toQuery = (p?: PageParams) => ({
  params: { page: p?.page ?? 0, size: p?.size ?? 20, ...(p?.sort ? { sort: p.sort } : {}) },
})

export const notificationsApi = {
  list: (p?: PageParams) => apiGet<Page<Notificacion>>("/api/v1/notifications", toQuery(p)),
  unread: (p?: PageParams) =>
    apiGet<Page<Notificacion>>("/api/v1/notifications/no-leidas", toQuery(p)),
  count: () => apiGet<ContadorNoLeidas>("/api/v1/notifications/contador"),
  markRead: (id: string) => apiPatch<void>(`/api/v1/notifications/${id}/leer`),
  markAllRead: () => apiPatch<void>("/api/v1/notifications/leer-todas"),
  remove: (id: string) => apiDelete<void>(`/api/v1/notifications/${id}`),
}
