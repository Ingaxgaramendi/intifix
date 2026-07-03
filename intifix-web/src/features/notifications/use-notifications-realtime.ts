import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createNotificationsClient } from "@/lib/notifications-socket"
import { useAuthStore } from "@/stores/auth-store"
import type { Notificacion } from "@/api/notifications"
import { NOTIF_KEY } from "./use-notifications"
import { routeForNotif } from "./notif-meta"

/** True si el navegador soporta la API de notificaciones de escritorio. */
export const supportsDesktopNotifications =
  typeof window !== "undefined" && "Notification" in window

/**
 * Suscribe la app al push de notificaciones por WebSocket. En cada notificación:
 * refresca la bandeja y el contador, muestra un toast con acción "Ver" y, si la
 * pestaña está en segundo plano y el permiso fue concedido, lanza una
 * notificación de escritorio. Debe montarse una sola vez (en AppShell).
 */
export function useNotificationsRealtime() {
  const token = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) return

    const handle = (n: Notificacion) => {
      qc.invalidateQueries({ queryKey: NOTIF_KEY })
      const target = routeForNotif(n)

      toast(n.titulo, {
        description: n.cuerpo,
        action: target ? { label: "Ver", onClick: () => navigate(target) } : undefined,
      })

      // Notificación de escritorio solo si el usuario no está mirando la pestaña.
      if (
        supportsDesktopNotifications &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        const desktop = new Notification(n.titulo, {
          body: n.cuerpo,
          icon: "/favicon.svg",
          tag: n.id,
        })
        desktop.onclick = () => {
          window.focus()
          if (target) navigate(target)
          desktop.close()
        }
      }
    }

    const client = createNotificationsClient(token, handle)
    client.activate()
    return () => client.deactivate()
  }, [token, qc, navigate])
}

/** Pide permiso para notificaciones de escritorio. Devuelve si quedó concedido. */
export async function requestDesktopPermission(): Promise<boolean> {
  if (!supportsDesktopNotifications) return false
  const result = await Notification.requestPermission()
  return result === "granted"
}
