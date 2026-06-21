import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/axios"
import type { Page, PageParams } from "@/types/api"
import type {
  Conversacion,
  CreateMensajeRequest,
  CrearConversacionRequest,
  Mensaje,
} from "@/types/chat"

const pageParams = (p?: PageParams) => ({
  params: { page: p?.page ?? 0, size: p?.size ?? 50, ...(p?.sort ? { sort: p.sort } : {}) },
})

export const chatApi = {
  /* ---- Conversaciones ---- */
  conversaciones: (p?: PageParams) =>
    apiGet<Page<Conversacion> | Conversacion[]>("/api/v1/chat/conversaciones", pageParams(p)),

  crearConversacion: (body: CrearConversacionRequest) =>
    apiPost<Conversacion>("/api/v1/chat/conversaciones", body),

  conversacion: (id: string) => apiGet<Conversacion>(`/api/v1/chat/conversaciones/${id}`),

  archivar: (id: string) => apiPatch<Conversacion>(`/api/v1/chat/conversaciones/${id}/archivar`),
  bloquear: (id: string) => apiPatch<Conversacion>(`/api/v1/chat/conversaciones/${id}/bloquear`),
  eliminarConversacion: (id: string) => apiDelete<void>(`/api/v1/chat/conversaciones/${id}`),

  /* ---- Mensajes ---- */
  mensajes: (idConversacion: string, p?: PageParams) =>
    apiGet<Page<Mensaje> | Mensaje[]>(
      `/api/v1/chat/mensajes/conversacion/${idConversacion}`,
      pageParams(p),
    ),

  enviar: (body: CreateMensajeRequest) => apiPost<Mensaje>("/api/v1/chat/mensajes", body),

  editar: (id: string, contenido: string) =>
    apiPut<Mensaje>(`/api/v1/chat/mensajes/${id}`, { contenido }),

  eliminar: (id: string) => apiDelete<void>(`/api/v1/chat/mensajes/${id}`),

  marcarLeidos: (idConversacion: string) =>
    apiPost<void>(`/api/v1/chat/mensajes/conversacion/${idConversacion}/leer`),

  noLeidos: (idConversacion: string) =>
    apiGet<number>(`/api/v1/chat/mensajes/conversacion/${idConversacion}/no-leidos`),
}
