import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createChatClient, type ChatClient } from "@/lib/chat-socket"
import { useAuthStore } from "@/stores/auth-store"
import type { Mensaje } from "@/types/chat"
import { chatKeys, upsertMensaje } from "./use-chat"

/**
 * Owns the chat WebSocket for the page. Incoming messages are merged into the
 * relevant thread cache; typing/read events update local state. Exposes
 * publishers for read receipts and typing, plus the connection flag (used to
 * toggle the polling fallback in useMensajes).
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
      },
      onTyping: (e) => {
        if (e.idUsuario === myId) return
        setTypingByConv((prev) => ({ ...prev, [e.idConversacion]: e.escribiendo }))
      },
      onRead: (e) => {
        if (e.idUsuario === myId) return
        // The other party read the thread → mark my messages as read.
        qc.setQueryData<Mensaje[]>(chatKeys.mensajes(e.idConversacion), (old) =>
          (old ?? []).map((m) => (mineRead(m, myId) ? { ...m, leido: true } : m)),
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
    sendTyping: (idConversacion: string, escribiendo: boolean) =>
      clientRef.current?.sendTyping(idConversacion, escribiendo),
  }
}

function mineRead(m: Mensaje, myId?: string): boolean {
  const sender = m.idRemitente ?? m.idEmisor ?? m.idUsuario
  return !!myId && sender === myId
}
