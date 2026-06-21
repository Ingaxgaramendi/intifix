import { useState } from "react"
import { FileText, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/shared/pagination"
import { EstadoBadge } from "@/components/services/estado-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { cotizacionComentario, cotizacionMonto, type Cotizacion } from "@/types/service"
import { useCancelarCotizacion, useMisCotizaciones } from "./use-technician"

function CotizacionRow({ c, onCancel, busy }: { c: Cotizacion; onCancel: () => void; busy: boolean }) {
  const pendiente = String(c.estado ?? "PENDIENTE").toUpperCase() === "PENDIENTE"
  const comentario = cotizacionComentario(c)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatCurrency(cotizacionMonto(c))}</span>
          <EstadoBadge estado={c.estado} />
        </div>
        {comentario && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{comentario}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {c.tiempoEstimado && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {c.tiempoEstimado}
            </span>
          )}
          <span>{formatDate(c.fechaCreacion)}</span>
        </div>
      </div>
      {pendiente && (
        <Button variant="outline" size="sm" onClick={onCancel} disabled={busy} className="shrink-0">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Cancelar
        </Button>
      )}
    </div>
  )
}

export function MisCotizacionesPage() {
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, refetch } = useMisCotizaciones(idTec, page)
  const cancelar = useCancelarCotizacion()
  const items = data?.content ?? []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mis cotizaciones</h1>
        <p className="mt-1 text-muted-foreground">Propuestas que has enviado a los clientes.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="mt-4 font-medium">No pudimos cargar tus cotizaciones</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">Aún no has enviado cotizaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisa los servicios disponibles y envía tu primera propuesta.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <CotizacionRow
              key={c.idCotizacion}
              c={c}
              busy={cancelar.isPending && cancelar.variables === c.idCotizacion}
              onCancel={() => cancelar.mutate(c.idCotizacion)}
            />
          ))}
        </div>
      )}

      {data && (
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
