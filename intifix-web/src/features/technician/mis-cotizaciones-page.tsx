import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueries } from "@tanstack/react-query"
import { FileText, Clock, AlertCircle, Loader2, Search, ChevronRight, User } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EstadoBadge } from "@/components/services/estado-badge"
import { servicesApi } from "@/api/services"
import { serviceKeys } from "@/features/services/use-services"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { paths } from "@/routes/paths"
import { cotizacionMonto, type Cotizacion, type Servicio } from "@/types/service"
import { useCancelarCotizacion, useMisCotizaciones } from "./use-technician"

type EstadoFiltro = "TODAS" | "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "EXPIRADA"

const FILTROS: { value: EstadoFiltro; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "ACEPTADA", label: "Aceptadas" },
  { value: "RECHAZADA", label: "Rechazadas" },
  { value: "EXPIRADA", label: "Expiradas" },
]

const estadoDe = (c: Cotizacion) => String(c.estado ?? "PENDIENTE").toUpperCase()

function CotizacionRow({
  c,
  servicio,
  cargando,
  onOpen,
  onCancel,
  busy,
}: {
  c: Cotizacion
  servicio?: Servicio
  cargando: boolean
  onOpen: () => void
  onCancel: () => void
  busy: boolean
}) {
  const pendiente = estadoDe(c) === "PENDIENTE"
  const cliente = servicio?.nombreCliente
  const portada = servicio?.fotos?.[0]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
    >
      {/* Miniatura del servicio */}
      <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
        {portada ? (
          <img src={portada} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatCurrency(cotizacionMonto(c))}</span>
          <EstadoBadge estado={c.estado} />
        </div>
        {/* Servicio + cliente */}
        {cargando ? (
          <Skeleton className="mt-1 h-4 w-48 rounded" />
        ) : (
          <p className="mt-0.5 truncate text-sm font-medium">{servicio?.titulo ?? "Servicio"}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {cliente && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {cliente}
            </span>
          )}
          {c.tiempoEstimado && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {c.tiempoEstimado}
            </span>
          )}
          <span>{formatDate(c.fechaEnvio ?? c.fechaCreacion)}</span>
        </div>
      </div>

      {pendiente && (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onCancel()
          }}
          disabled={busy}
          className="hidden shrink-0 sm:inline-flex"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Cancelar
        </Button>
      )}
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function MisCotizacionesPage() {
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMisCotizaciones(idTec, 0)
  const cancelar = useCancelarCotizacion()

  const [estado, setEstado] = useState<EstadoFiltro>("TODAS")
  const [q, setQ] = useState("")

  const cotizaciones = useMemo(() => data?.content ?? [], [data])

  // Trae el servicio de cada cotización (título + cliente). Cacheado por react-query.
  const serviceQueries = useQueries({
    queries: cotizaciones.map((c) => ({
      queryKey: serviceKeys.detail(c.idServicio),
      queryFn: () => servicesApi.detalle(c.idServicio),
      enabled: !!c.idServicio,
      staleTime: 60_000,
    })),
  })
  const servicioDe = (i: number): Servicio | undefined => serviceQueries[i]?.data

  // Conteos por estado para las píldoras de filtro.
  const conteos = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const c of cotizaciones) acc[estadoDe(c)] = (acc[estadoDe(c)] ?? 0) + 1
    return acc
  }, [cotizaciones])

  const visibles = useMemo(() => {
    const texto = q.trim().toLowerCase()
    return cotizaciones
      .map((c, i) => ({ c, s: servicioDe(i), loading: serviceQueries[i]?.isLoading ?? false }))
      .filter(({ c, s }) => {
        if (estado !== "TODAS" && estadoDe(c) !== estado) return false
        if (texto) {
          const hay = `${s?.titulo ?? ""} ${s?.nombreCliente ?? ""}`.toLowerCase()
          if (!hay.includes(texto)) return false
        }
        return true
      })
    // serviceQueries cambia de identidad por render; recomputamos siempre (barato).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizaciones, estado, q, serviceQueries])

  const abrir = (c: Cotizacion) =>
    navigate(paths.tecnico.cotizacionDetalle(c.idServicio, c.idCotizacion), {
      state: { cotizacion: c },
    })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mis cotizaciones</h1>
        <p className="mt-1 text-muted-foreground">Historial de propuestas que enviaste a los clientes.</p>
      </header>

      {/* Filtros */}
      {!isLoading && !isError && cotizaciones.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => {
              const total = f.value === "TODAS" ? cotizaciones.length : (conteos[f.value] ?? 0)
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setEstado(f.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    estado === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {f.label}
                  <span className={cn("text-xs", estado === f.value ? "opacity-80" : "opacity-60")}>{total}</span>
                </button>
              )
            })}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por servicio o cliente…"
              className="h-11 pl-9"
            />
          </div>
        </div>
      )}

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
      ) : cotizaciones.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">Aún no has enviado cotizaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisa los servicios disponibles y envía tu primera propuesta.
          </p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Ninguna cotización coincide con el filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {visibles.map(({ c, s, loading }) => (
            <CotizacionRow
              key={c.idCotizacion}
              c={c}
              servicio={s}
              cargando={loading}
              onOpen={() => abrir(c)}
              busy={cancelar.isPending && cancelar.variables === c.idCotizacion}
              onCancel={() => cancelar.mutate(c.idCotizacion)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
