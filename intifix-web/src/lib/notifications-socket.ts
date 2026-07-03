import { Client, type IMessage } from "@stomp/stompjs"
import type { Notificacion } from "@/api/notifications"

// Mismo endpoint STOMP que el chat: las colas privadas del usuario viajan por la
// misma conexión. El push llega a /user/queue/notifications (lo enruta Spring por
// el principal del token).
const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws/chat"

/**
 * Cliente STOMP ligero, dedicado SOLO a recibir notificaciones en tiempo real.
 * No publica nada; vive a nivel de app (AppShell) para que el push funcione en
 * cualquier pantalla. La autenticación va en el frame CONNECT.
 */
export function createNotificationsClient(token: string, onNotif: (n: Notificacion) => void) {
  const client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe("/user/queue/notifications", (frame: IMessage) => {
        try {
          onNotif(JSON.parse(frame.body) as Notificacion)
        } catch {
          /* frame no-JSON: ignorar */
        }
      })
    },
  })

  return {
    activate: () => client.activate(),
    deactivate: () => void client.deactivate(),
  }
}
