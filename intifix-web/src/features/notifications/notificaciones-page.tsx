import { useMemo, useState } from "react"
import { Bell, BellOff, Check, CheckCheck, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/shared/pagination"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import type { Notificacion } from "@/api/notifications"
import {
  useEliminarNotif,
  useMarcarLeida,
  useMarcarTodas,
  useNotificaciones,
} from "./use-notifications"

function NotifRow({
  n,
  onRead,
  onDelete,
  busy,
}: {
  n: Notificacion
  onRead: () => void
  onDelete: () => void
  busy: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
        n.leida ? "border-border bg-card" : "border-primary/30 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          n.leida ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
        )}
      >
        <Bell className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate", n.leida ? "font-medium" : "font-semibold")}>{n.titulo}</p>
          {!n.leida && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{n.mensaje}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.fechaCreacion)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!n.leida && (
          <button
            onClick={onRead}
            disabled={busy}
            aria-label="Marcar como leída"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDelete}
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

export function NotificacionesPage() {
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
