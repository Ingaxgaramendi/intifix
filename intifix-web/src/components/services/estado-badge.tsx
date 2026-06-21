import { cn } from "@/lib/utils"
import type { EstadoServicio } from "@/types/service"

const STYLES: Record<string, string> = {
  PENDIENTE: "bg-warning/15 text-foreground ring-warning/40",
  COTIZANDO: "bg-info/15 text-info ring-info/30",
  ASIGNADO: "bg-primary/10 text-primary ring-primary/20",
  EN_PROCESO: "bg-primary/10 text-primary ring-primary/20",
  FINALIZADO: "bg-success/15 text-success ring-success/30",
  CANCELADO: "bg-destructive/10 text-destructive ring-destructive/20",
  // Quote statuses
  ACEPTADA: "bg-success/15 text-success ring-success/30",
  RECHAZADA: "bg-destructive/10 text-destructive ring-destructive/20",
  EXPIRADA: "bg-muted text-muted-foreground ring-border",
}

const LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  COTIZANDO: "Cotizando",
  ASIGNADO: "Asignado",
  EN_PROCESO: "En proceso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  EXPIRADA: "Expirada",
}

/** Color-coded pill for a service/assignment status; tolerates unknown values. */
export function EstadoBadge({ estado, className }: { estado?: EstadoServicio; className?: string }) {
  if (!estado) return null
  const key = String(estado).toUpperCase()
  const style = STYLES[key] ?? "bg-muted text-muted-foreground ring-border"
  const label = LABELS[key] ?? String(estado).replace(/_/g, " ").toLowerCase()
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        style,
        className,
      )}
    >
      {label}
    </span>
  )
}
