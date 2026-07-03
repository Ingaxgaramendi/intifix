import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, ChevronLeft, ChevronRight, ClipboardList, MapPin, AlertCircle, Wrench } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EstadoBadge } from "@/components/services/estado-badge"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { paths } from "@/routes/paths"
import {
  servicioDireccion,
  servicioPresupuesto,
  type EstadoServicio,
  type Servicio,
} from "@/types/service"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio",
  EN_TALLER_TECNICO: "En taller",
}
import { useEspecialidadesMap, useMisServicios } from "./use-services"

const FILTERS: { label: string; value: EstadoServicio | "TODOS" }[] = [
  { label: "Todos", value: "TODOS" },
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Cotizando", value: "COTIZANDO" },
  { label: "Asignados", value: "ASIGNADO" },
  { label: "En proceso", value: "EN_PROCESO" },
  { label: "Finalizados", value: "FINALIZADO" },
]

function ServicioCard({ s, especialidad }: { s: Servicio; especialidad?: string }) {
  const portada = s.fotos?.[0]
  return (
    <Link
      to={paths.cliente.servicioDetalle(s.idServicio)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg dark:hover:border-primary/60 dark:hover:shadow-xl"
    >
      {portada && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img src={portada} alt={s.titulo} className="h-full w-full object-cover" loading="lazy" />
          {(s.fotos?.length ?? 0) > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              +{(s.fotos?.length ?? 0) - 1}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug group-hover:text-primary">{s.titulo}</h3>
          <EstadoBadge estado={s.estado} />
        </div>
        {especialidad && (
          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Wrench className="h-3 w-3" />
            {especialidad}
          </span>
        )}
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.descripcion}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {s.modalidad && (
            <span className="font-medium text-foreground">
              {MODALIDAD_LABEL[s.modalidad] ?? s.modalidad}
            </span>
          )}
          {servicioDireccion(s) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {servicioDireccion(s)}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">{formatDate(s.fechaCreacion)}</span>
          <span className="font-semibold">{formatCurrency(servicioPresupuesto(s))}</span>
        </div>
      </div>
    </Link>
  )
}

export function MisServiciosPage() {
  const idCliente = useAuthStore((st) => st.user?.idUsuario)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<EstadoServicio | "TODOS">("TODOS")
  const { data, isLoading, isError, refetch } = useMisServicios(idCliente, page)
  const especialidades = useEspecialidadesMap()

  const visible = useMemo(() => {
    const content = data?.content ?? []
    if (filter === "TODOS") return content
    return content.filter((s) => String(s.estado).toUpperCase() === filter)
  }, [data, filter])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis servicios</h1>
          <p className="mt-1 text-muted-foreground">Sigue el estado de tus solicitudes.</p>
        </div>
        <Button asChild className="px-5">
          <Link to={paths.cliente.pedir}>
            <Plus className="h-4 w-4" />
            Pedir servicio
          </Link>
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* States */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
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
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">No tienes servicios aquí</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera solicitud y recibe cotizaciones en minutos.
          </p>
          <Button asChild className="mt-5">
            <Link to={paths.cliente.pedir}>
              <Plus className="h-4 w-4" />
              Pedir servicio
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <ServicioCard
              key={s.idServicio}
              s={s}
              especialidad={s.idEspecialidad ? especialidades.get(s.idEspecialidad) : undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="outline"
            size="icon"
            disabled={data.first}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {data.number + 1} de {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={data.last}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
