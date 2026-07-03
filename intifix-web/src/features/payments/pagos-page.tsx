import { useState } from "react"
import { Link } from "react-router-dom"
import { CreditCard, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/shared/pagination"
import { EstadoBadge } from "@/components/services/estado-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { paths } from "@/routes/paths"
import { servicioPresupuesto, type Servicio } from "@/types/service"
import { isPagoPagado } from "@/types/payment"
import { useMisServicios } from "@/features/services/use-services"
import { usePagoByServicio } from "./use-payments"

/** Fila de un servicio en Pagos: muestra el monto ACORDADO/pagado, no el presupuesto inicial. */
function PagoRow({ s }: { s: Servicio }) {
  const { data: pago } = usePagoByServicio(s.idServicio)
  const pagado = isPagoPagado(pago)
  const presupuesto = servicioPresupuesto(s)
  // El monto real es el del pago (precio acordado en la cotización); si aún no hay
  // pago, caemos al presupuesto inicial como referencia.
  const acordado = pago?.montoTotal ?? undefined
  const montoMostrar = acordado ?? presupuesto
  const difiere = acordado != null && presupuesto != null && Math.abs(acordado - presupuesto) >= 0.01

  return (
    <Link
      to={paths.cliente.pago(s.idServicio)}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{s.titulo}</p>
          <EstadoBadge estado={s.estado} />
          {pagado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{formatDate(s.fechaProgramada)}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {pagado ? "Pagado" : acordado != null ? "Acordado" : "Estimado"}
          </p>
          <p className="font-semibold">{formatCurrency(montoMostrar)}</p>
          {difiere && (
            <p className="text-xs text-muted-foreground line-through">{formatCurrency(presupuesto)}</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

export function PagosPage() {
  const idCliente = useAuthStore((s) => s.user?.idUsuario)
  const [page, setPage] = useState(0)
  const { data, isLoading, isError, refetch } = useMisServicios(idCliente, page)
  const items = data?.content ?? []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
        <p className="mt-1 text-muted-foreground">Paga tus servicios y consulta tus comprobantes.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="mt-4 font-medium">No pudimos cargar tus servicios</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">Nada que pagar todavía</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando contrates un servicio, aquí podrás pagarlo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <PagoRow key={s.idServicio} s={s} />
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
