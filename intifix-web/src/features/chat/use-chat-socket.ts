import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createChatClient, type ChatClient } from "@/lib/chat-socket"
import { useAuthStore } from "@/stores/auth-store"
import { mensajeRemitente, type Mensaje } from "@/types/chat"
import { chatKeys, upsertMensaje } from "./use-chat"

/**
 * Owns the chat WebSocket for the page. Incoming messages are merged into the
 * relevant thread cache and acknowledged as "delivered"; typing/read/delivered
 * events update message state. Exposes publishers for read/delivered receipts
 * and typing, plus the connection flag (toggles the polling fallback).
 */
export function useChatSocket() {
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.accessToken)
  const myId = useAuthStore((s) => s.user?.idUsuario)

  const [connected, setConnected] = useState(false)
  const [typingByConv, setTypingByConv] = useState<Record<string, boolean>>({})
  const clientRef = useRef<ChatClient | null>(null)

  useEffect(() => {
    if (!token) return
    const client = createChatClient(token, {
      onConnectChange: setConnected,
      onMessage: (m: Mensaje) => {
        qc.setQueryData<Mensaje[]>(chatKeys.mensajes(m.idConversacion), (old) =>
          upsertMensaje(old, m),
        )
        qc.invalidateQueries({ queryKey: chatKeys.conversaciones })
        // I just received a message → tell the sender it was delivered (✓✓).
        clientRef.current?.sendDelivered(m.idConversacion)
      },
      onTyping: (e) => {
        if (e.idUsuario === myId) return
        setTypingByConv((prev) => ({ ...prev, [e.idConversacion]: e.escribiendo }))
      },
      onDelivered: (e) => {
        if (e.idUsuario === myId) return
        // The other party received my messages → ENVIADO → RECIBIDO.
        qc.setQueryData<Mensaje[]>(chatKeys.mensajes(e.idConversacion), (old) =>
          (old ?? []).map((m) =>
            mine(m, myId) && m.estado !== "LEIDO" ? { ...m, estado: "RECIBIDO" } : m,
          ),
        )
      },
      onRead: (e) => {
        if (e.idUsuario === myId) return
        // The other party read the thread → all my messages become LEIDO.
        qc.setQueryData<Mensaje[]>(chatKeys.mensajes(e.idConversacion), (old) =>
          (old ?? []).map((m) => (mine(m, myId) ? { ...m, estado: "LEIDO", leido: true } : m)),
        )
      },
    })
    clientRef.current = client
    client.activate()
    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [token, myId, qc])

  return {
    connected,
    typingByConv,
    sendRead: (idConversacion: string) => clientRef.current?.sendRead(idConversacion),
    sendDelivered: (idConversacion: string) => clientRef.current?.sendDelivered(idConversacion),
    sendTyping: (idConversacion: string, escribiendo: boolean) =>
      clientRef.current?.sendTyping(idConversacion, escribiendo),
  }
}

function mine(m: Mensaje, myId?: string): boolean {
  return !!myId && mensajeRemitente(m) === myId
}
