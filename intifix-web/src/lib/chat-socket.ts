import { Client, type IMessage } from "@stomp/stompjs"
import type {
  ChatDeliveredEvent,
  ChatReadEvent,
  ChatTypingEvent,
  CreateMensajeRequest,
  Mensaje,
} from "@/types/chat"

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws/chat"

export interface ChatSocketHandlers {
  onMessage?: (m: Mensaje) => void
  onRead?: (e: ChatReadEvent) => void
  onDelivered?: (e: ChatDeliveredEvent) => void
  onTyping?: (e: ChatTypingEvent) => void
  onConnectChange?: (connected: boolean) => void
}

const parse = <T>(frame: IMessage): T | null => {
  try {
    return JSON.parse(frame.body) as T
  } catch {
    return null
  }
}

/**
 * Wraps a Spring STOMP client over a native WebSocket. Auth travels in the
 * CONNECT frame headers (the endpoint does NOT expose SockJS). Subscriptions:
 * /user/queue/{messages,read,typing}; publishes go to /app/chat.*.
 */
export function createChatClient(token: string, handlers: ChatSocketHandlers) {
  const client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      handlers.onConnectChange?.(true)
      client.subscribe("/user/queue/messages", (f) => {
        const m = parse<Mensaje>(f)
        if (m) handlers.onMessage?.(m)
      })
      client.subscribe("/user/queue/read", (f) => {
        const e = parse<ChatReadEvent>(f)
        if (e) handlers.onRead?.(e)
      })
      client.subscribe("/user/queue/delivered", (f) => {
        const e = parse<ChatDeliveredEvent>(f)
        if (e) handlers.onDelivered?.(e)
      })
      client.subscribe("/user/queue/typing", (f) => {
        const e = parse<ChatTypingEvent>(f)
        if (e) handlers.onTyping?.(e)
      })
      safePublish(client, "/app/chat.online")
    },
    onDisconnect: () => handlers.onConnectChange?.(false),
    onWebSocketClose: () => handlers.onConnectChange?.(false),
  })

  return {
    activate: () => client.activate(),
    deactivate: () => {
      safePublish(client, "/app/chat.offline")
      void client.deactivate()
    },
    get connected() {
      return client.connected
    },
    sendMessage: (body: CreateMensajeRequest) =>
      safePublish(client, "/app/chat.send", body),
    sendRead: (idConversacion: string) =>
      safePublish(client, "/app/chat.read", { idConversacion }),
    sendDelivered: (idConversacion: string) =>
      safePublish(client, "/app/chat.delivered", { idConversacion }),
    sendTyping: (idConversacion: string, escribiendo: boolean) =>
      safePublish(client, "/app/chat.typing", { idConversacion, escribiendo }),
  }
}

function safePublish(client: Client, destination: string, body?: unknown) {
  if (!client.connected) return
  client.publish({ destination, body: body ? JSON.stringify(body) : undefined })
}

export type ChatClient = ReturnType<typeof createChatClient>
