import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BellOff, Check, CheckCheck, Trash2, AlertCircle, BellRing, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/shared/pagination"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/format"
import type { Notificacion } from "@/api/notifications"
import {
  useEliminarNotif,
  useMarcarLeida,
  useMarcarTodas,
  useNotificaciones,
} from "./use-notifications"
import {
  requestDesktopPermission,
  supportsDesktopNotifications,
} from "./use-notifications-realtime"
import { notifVisual, routeForNotif } from "./notif-meta"

function NotifRow({
  n,
  onRead,
  onDelete,
  onOpen,
  busy,
}: {
  n: Notificacion
  onRead: () => void
  onDelete: () => void
  onOpen?: () => void
  busy: boolean
}) {
  const { icon: Icon, color, bg } = notifVisual(n.tipo)
  const clickable = !!onOpen

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onOpen?.() : undefined}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border p-4 transition-all",
        n.leida ? "border-border bg-card" : "border-primary/30 bg-primary/5",
        clickable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-xl",
      )}
    >
      <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", bg, color)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate", n.leida ? "font-medium" : "font-semibold")}>{n.titulo}</p>
          {!n.leida && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.cuerpo}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatRelative(n.creadoEn)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!n.leida && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRead()
            }}
            disabled={busy}
            aria-label="Marcar como leída"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          disabled={busy}
          aria-label="Eliminar"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/** Banner que invita a activar las notificaciones de escritorio (push). */
function DesktopPushBanner() {
  const [permission, setPermission] = useState(
    supportsDesktopNotifications ? Notification.permission : "denied",
  )
  const [dismissed, setDismissed] = useState(false)

  if (!supportsDesktopNotifications || permission !== "default" || dismissed) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <BellRing className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Activa las notificaciones de escritorio</p>
        <p className="text-sm text-muted-foreground">
          Recibe avisos al instante aunque tengas otra pestaña abierta.
        </p>
      </div>
      <Button
        size="sm"
        onClick={async () => setPermission((await requestDesktopPermission()) ? "granted" : "denied")}
      >
        Activar
      </Button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Descartar"
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function NotificacionesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [soloNoLeidas, setSoloNoLeidas] = useState(false)
  const { data, isLoading, isError, refetch } = useNotificaciones(page)
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodas()
  const eliminar = useEliminarNotif()

  const items = useMemo(() => {
    const content = data?.content ?? []
    return soloNoLeidas ? content.filter((n) => !n.leida) : content
  }, [data, soloNoLeidas])

  const hayNoLeidas = (data?.content ?? []).some((n) => !n.leida)
  const busy = marcarLeida.isPending || eliminar.isPending

  const abrir = (n: Notificacion) => {
    const target = routeForNotif(n)
    if (!target) return
    if (!n.leida) marcarLeida.mutate(n.id)
    navigate(target)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="mt-1 text-muted-foreground">Mantente al día con tu actividad.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!hayNoLeidas || marcarTodas.isPending}
          onClick={() => marcarTodas.mutate()}
        >
          <CheckCheck className="h-4 w-4" />
          Marcar todas
        </Button>
      </header>

      <DesktopPushBanner />

      <div className="flex gap-2">
        {[
          { label: "Todas", value: false },
          { label: "No leídas", value: true },
        ].map((f) => (
          <button
            key={f.label}
            onClick={() => setSoloNoLeidas(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              soloNoLeidas === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="mt-4 font-medium">No pudimos cargar tus notificaciones</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BellOff className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">
            {soloNoLeidas ? "No tienes notificaciones sin leer" : "No tienes notificaciones"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Te avisaremos cuando haya novedades.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <NotifRow
              key={n.id}
              n={n}
              busy={busy}
              onRead={() => marcarLeida.mutate(n.id)}
              onDelete={() => eliminar.mutate(n.id)}
              onOpen={routeForNotif(n) ? () => abrir(n) : undefined}
            />
          ))}
        </div>
      )}

      {data && !soloNoLeidas && (
        <Pagination
          page={data.number}
          totalPages={data.totalPages}
          first={data.first}
          last={data.last}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
