import { Bell, MessageSquare, CreditCard, Briefcase, Ban, Megaphone } from "lucide-react"
import { paths } from "@/routes/paths"
import type { Notificacion, TipoNotificacion } from "@/api/notifications"

export interface NotifVisual {
  icon: typeof Bell
  /** clase de texto para el ícono */
  color: string
  /** clase de fondo del avatar */
  bg: string
}

/** Ícono + colores por tipo de notificación (estilo Airbnb, suave). */
export function notifVisual(tipo: TipoNotificacion): NotifVisual {
  switch (tipo) {
    case "MENSAJE_NUEVO":
    case "MENSAJE_LEIDO":
      return { icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-500/10" }
    case "PAGO":
      return { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-500/10" }
    case "SERVICIO":
      return { icon: Briefcase, color: "text-primary", bg: "bg-primary/10" }
    case "CONVERSACION_BLOQUEADA":
      return { icon: Ban, color: "text-destructive", bg: "bg-destructive/10" }
    case "SISTEMA":
      return { icon: Megaphone, color: "text-amber-600", bg: "bg-amber-500/10" }
    default:
      return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" }
  }
}

/**
 * A dónde lleva la notificación al tocarla. Solo enrutamos las de chat, cuyo
 * `referenciaId` es el id de la conversación; el resto no tiene destino seguro
 * (cliente/técnico difieren) y se devuelve null para no generar enlaces rotos.
 */
export function routeForNotif(n: Notificacion): string | null {
  if (!n.referenciaId) return null
  switch (n.tipo) {
    case "MENSAJE_NUEVO":
    case "MENSAJE_LEIDO":
    case "CONVERSACION_BLOQUEADA":
      return paths.shared.chatConversacion(n.referenciaId)
    default:
      return null
  }
}
