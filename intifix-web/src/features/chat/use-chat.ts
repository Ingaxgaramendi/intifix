import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { chatApi } from "@/api/chat"
import { toItems } from "@/lib/list"
import type { CreateMensajeRequest, Mensaje } from "@/types/chat"

export const chatKeys = {
  conversaciones: ["conversaciones"] as const,
  mensajes: (id: string) => ["mensajes", id] as const,
}

/** Append a message to a cached thread, de-duping by id. */
export function upsertMensaje(old: Mensaje[] | undefined, m: Mensaje): Mensaje[] {
  const list = old ?? []
  if (list.some((x) => x.idMensaje === m.idMensaje)) {
    return list.map((x) => (x.idMensaje === m.idMensaje ? { ...x, ...m } : x))
  }
  return [...list, m]
}

export function useConversaciones() {
  return useQuery({
    queryKey: chatKeys.conversaciones,
    queryFn: async () => toItems(await chatApi.conversaciones({ size: 50 })),
  })
}

/** Thread messages. Falls back to polling when the socket is disconnected. */
export function useMensajes(idConversacion: string, socketConnected: boolean) {
  return useQuery({
    queryKey: chatKeys.mensajes(idConversacion),
    queryFn: async () =>
      toItems(await chatApi.mensajes(idConversacion, { size: 100, sort: "fecha,asc" })),
    enabled: !!idConversacion,
    refetchInterval: socketConnected ? false : 4000,
  })
}

export function useEnviarMensaje(idConversacion: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMensajeRequest) => chatApi.enviar(body),
    onSuccess: (msg) => {
      qc.setQueryData<Mensaje[]>(chatKeys.mensajes(idConversacion), (old) => upsertMensaje(old, msg))
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
    },
  })
}

export function useMarcarLeidos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idConversacion: string) => chatApi.marcarLeidos(idConversacion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
      qc.invalidateQueries({ queryKey: ["notifications", "count"] })
    },
  })
}
