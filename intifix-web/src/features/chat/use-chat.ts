import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { chatApi } from "@/api/chat"
import { toItems } from "@/lib/list"
import { useAuthStore } from "@/stores/auth-store"
import {
  conversacionId,
  mensajeFecha,
  mensajeId,
  type CreateMensajeRequest,
  type Mensaje,
} from "@/types/chat"

export const PAGE_SIZE = 30

export const chatKeys = {
  conversaciones: ["conversaciones"] as const,
  mensajes: (id: string) => ["mensajes", id] as const,
}

const tiempo = (m: Mensaje): number => {
  const f = mensajeFecha(m)
  const t = f ? new Date(f).getTime() : 0
  return Number.isNaN(t) ? 0 : t
}

/** Chronological order (oldest first → newest last), WhatsApp-style. Stable so
 *  messages without a timestamp keep their insertion order. */
export function sortMensajes(list: Mensaje[]): Mensaje[] {
  return list
    .map((m, i) => [m, i] as const)
    .sort((a, b) => tiempo(a[0]) - tiempo(b[0]) || a[1] - b[1])
    .map(([m]) => m)
}

/** Append/merge a message into a cached thread, de-duping by stable id and
 *  keeping chronological (ascending) order. */
export function upsertMensaje(old: Mensaje[] | undefined, m: Mensaje): Mensaje[] {
  const list = old ?? []
  const id = mensajeId(m)
  const merged =
    id && list.some((x) => mensajeId(x) === id)
      ? list.map((x) => (mensajeId(x) === id ? { ...x, ...m } : x))
      : [...list, m]
  return sortMensajes(merged)
}

export function useConversaciones() {
  return useQuery({
    queryKey: chatKeys.conversaciones,
    queryFn: async () => {
      const items = toItems(await chatApi.conversaciones({ size: 50 }))
      // Normalize id + derive archivada/bloqueada from the backend's `estado` enum.
      return items
        .map((c) => {
          const estado = (c.estado as string | undefined) ?? ""
          return {
            ...c,
            idConversacion: conversacionId(c),
            archivada: estado === "ARCHIVADA",
            bloqueada: estado === "BLOQUEADA",
          }
        })
        .filter((c) => c.idConversacion)
    },
  })
}

/** Fetches the latest page of a thread (newest first on the wire → reversed to
 *  ascending for display). Falls back to polling when the socket is down. */
export function useMensajes(idConversacion: string, socketConnected: boolean) {
  return useQuery({
    queryKey: chatKeys.mensajes(idConversacion),
    queryFn: async () => {
      const items = toItems(
        await chatApi.mensajes(idConversacion, { page: 0, size: PAGE_SIZE, sort: "creadoEn,desc" }),
      )
      // Order client-side so we don't depend on the backend's sort behaviour.
      return sortMensajes(items)
    },
    enabled: !!idConversacion,
    refetchInterval: socketConnected ? false : 4000,
  })
}

/** Loads an older page and prepends it to the cached thread (infinite scroll up).
 *  Resolves how many more pages exist so the caller can stop. */
export function useCargarAnteriores(idConversacion: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (page: number): Promise<{ added: number; hasMore: boolean }> => {
      const res = await chatApi.mensajes(idConversacion, {
        page,
        size: PAGE_SIZE,
        sort: "creadoEn,desc",
      })
      const fetched = toItems(res)
      const totalPages = Array.isArray(res) ? undefined : res.totalPages
      let added = 0
      qc.setQueryData<Mensaje[]>(chatKeys.mensajes(idConversacion), (old) => {
        const existing = old ?? []
        const seen = new Set(existing.map(mensajeId))
        const older = fetched.filter((m) => !seen.has(mensajeId(m)))
        added = older.length
        return sortMensajes([...older, ...existing])
      })
      const hasMore =
        totalPages == null ? fetched.length === PAGE_SIZE : page + 1 < totalPages
      return { added, hasMore }
    },
  })
}

export function useEnviarMensaje(idConversacion: string) {
  const qc = useQueryClient()
  const myId = useAuthStore((s) => s.user?.idUsuario)
  return useMutation({
    mutationFn: (body: CreateMensajeRequest) => chatApi.enviar(body),
    onMutate: async (body): Promise<{ tempId: string }> => {
      const tempId = `temp-${crypto.randomUUID()}`
      const optimistic: Mensaje = {
        id: tempId,
        idMensaje: tempId,
        idConversacion,
        tipo: body.tipo,
        contenido: body.contenido,
        adjunto: body.adjunto,
        idEmisor: myId,
        estado: "ENVIADO",
        creadoEn: new Date().toISOString(),
        _optimistic: true,
      }
      qc.setQueryData<Mensaje[]>(chatKeys.mensajes(idConversacion), (old) =>
        sortMensajes([...(old ?? []), optimistic]),
      )
      return { tempId }
    },
    onSuccess: (msg, _body, ctx) => {
      qc.setQueryData<Mensaje[]>(chatKeys.mensajes(idConversacion), (old) => {
        const withoutTemp = (old ?? []).filter((m) => mensajeId(m) !== ctx?.tempId)
        return upsertMensaje(withoutTemp, msg)
      })
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
    },
    onError: (_err, _body, ctx) => {
      qc.setQueryData<Mensaje[]>(chatKeys.mensajes(idConversacion), (old) =>
        (old ?? []).map((m) =>
          mensajeId(m) === ctx?.tempId ? { ...m, _optimistic: false, _failed: true } : m,
        ),
      )
    },
  })
}

/** Create (or reuse) the conversation for a service. */
export function useCrearConversacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idServicio: string) => chatApi.crearConversacion({ idServicio }),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversaciones }),
  })
}

/**
 * Find-or-create the conversation for a service and resolve its id, so callers
 * can deep-link straight to the thread (no 409 when it already exists).
 */
export function useAbrirChatServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (idServicio: string): Promise<string> => {
      const list = toItems(await chatApi.conversaciones({ size: 50 }))
      const existing = list.find((c) => c.idServicio === idServicio)
      if (existing) return conversacionId(existing)
      const created = await chatApi.crearConversacion({ idServicio })
      return conversacionId(created)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversaciones }),
  })
}

/* ---- Conversation management ---- */

export function useArchivarConversacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatApi.archivar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
      toast.success("Conversación archivada")
    },
  })
}

export function useDesarchivarConversacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatApi.desarchivar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
      toast.success("Conversación desarchivada")
    },
  })
}

export function useBloquearConversacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatApi.bloquear(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
      toast.success("Conversación bloqueada")
    },
  })
}

export function useDesbloquearConversacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatApi.desbloquear(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
      toast.success("Conversación desbloqueada")
    },
  })
}

export function useEliminarConversacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatApi.eliminarConversacion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
      toast.success("Conversación eliminada")
    },
  })
}

/* ---- Message editing ---- */

export function useEditarMensaje(idConversacion: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, contenido }: { id: string; contenido: string }) =>
      chatApi.editar(id, contenido),
    onSuccess: (msg) => {
      qc.setQueryData<Mensaje[]>(chatKeys.mensajes(idConversacion), (old) => upsertMensaje(old, msg))
      toast.success("Mensaje editado")
    },
  })
}

export function useEliminarMensaje(idConversacion: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => chatApi.eliminar(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<Mensaje[]>(chatKeys.mensajes(idConversacion), (old) =>
        (old ?? []).filter((m) => mensajeId(m) !== id),
      )
      qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
      toast.success("Mensaje eliminado")
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
