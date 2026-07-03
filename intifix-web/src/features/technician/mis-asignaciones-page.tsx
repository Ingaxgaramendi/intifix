import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ClipboardList,
  AlertCircle,
  Play,
  CheckCircle2,
  Upload,
  Calendar,
  MessageSquare,
  User,
  MapPin,
  Wallet,
  Tag,
  FileText,
  ChevronRight,
  Search,
  X,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useAbrirChatServicio } from "@/features/chat/use-chat"
import { useServicioDetalle } from "@/features/services/use-services"
import { paths } from "@/routes/paths"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PerfilLink } from "@/components/shared/perfil-link"
import { Pagination } from "@/components/shared/pagination"
import { EstadoBadge } from "@/components/services/estado-badge"
import { EvidenciaUploader } from "@/components/services/evidencia-uploader"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { asignacionEstado, servicioDireccion, type Asignacion } from "@/types/service"
import { useFinalizarAsignacion, useIniciarAsignacion, useMisAsignaciones } from "./use-technician"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio",
  EN_TALLER_TECNICO: "En taller",
}

const FILTROS_ESTADO = [
  { label: "Todas", value: "" },
  { label: "Asignado", value: "ASIGNADO" },
  { label: "En proceso", value: "EN_PROCESO" },
  { label: "Finalizado", value: "FINALIZADO" },
  { label: "Cancelado", value: "CANCELADO" },
] as const

function AsignacionCard({
  a,
  onIniciar,
  onFinalizar,
  onEvidencia,
  onChat,
  onVerDetalle,
  busy,
}: {
  a: Asignacion
  onIniciar: () => void
  onFinalizar: () => void
  onEvidencia: () => void
  onChat: () => void
  onVerDetalle: () => void
  busy: boolean
}) {
  const estado = asignacionEstado(a).toUpperCase()
  const finalizada = ["FINALIZADO", "COMPLETADO", "CANCELADO"].includes(estado)
  const enProceso = ["EN_PROCESO", "EN_PROGRESO", "INICIADO"].includes(estado)

  // Datos enriquecidos que ya vienen del backend en el listado
  const tituloDirecto = a.tituloServicio
  const clienteDirecto = a.nombreCliente
  const idClienteDirecto = a.idCliente

  // Detalle completo solo si necesitamos la foto o la dirección
  const { data: s, isLoading } = useServicioDetalle(a.idServicio)
  const portada = s?.fotos?.[0]
  const direccion = s ? servicioDireccion(s) : undefined
  const titulo = tituloDirecto ?? s?.titulo ?? "Servicio"
  const cliente = clienteDirecto ?? s?.nombreCliente
  const idCliente = idClienteDirecto ?? s?.idCliente

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg dark:hover:border-primary/50 dark:hover:shadow-xl">
      {/* Portada */}
      <button type="button" onClick={onVerDetalle} className="block text-left">
        {portada ? (
          <div className="h-36 w-full overflow-hidden bg-muted">
            <img
              src={portada}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-muted/60 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-40" />
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Título + estado */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isLoading && !tituloDirecto ? (
              <Skeleton className="h-5 w-40 rounded" />
            ) : (
              <button
                type="button"
                onClick={onVerDetalle}
                className="block w-full truncate text-left text-base font-semibold leading-snug hover:text-primary"
              >
                {titulo}
              </button>
            )}
            {(cliente || idCliente) && (
              <PerfilLink
                to={idCliente ? paths.tecnico.clientePerfil(idCliente) : undefined}
                state={{ idServicio: a.idServicio }}
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary/80 hover:text-primary"
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                {cliente ?? "Ver cliente"}
              </PerfilLink>
            )}
          </div>
          <EstadoBadge estado={asignacionEstado(a)} />
        </div>

        {/* Metadata en grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-xl bg-muted/40 p-3 text-sm">
          {s?.modalidad && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="truncate">{MODALIDAD_LABEL[s.modalidad] ?? s.modalidad}</span>
            </div>
          )}
          {s?.presupuestoMaximo != null && (
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Wallet className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span>{formatCurrency(s.presupuestoMaximo)}</span>
            </div>
          )}
          {s?.fechaProgramada && (
            <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span>{formatDateTime(s.fechaProgramada)}</span>
            </div>
          )}
          {direccion && (
            <div className="col-span-2 flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="line-clamp-2 leading-snug">{direccion}</span>
            </div>
          )}
          {!s && !isLoading && (
            <p className="col-span-2 text-xs text-muted-foreground/60">Sin detalles adicionales</p>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
          {!enProceso && !finalizada && (
            <Button size="sm" onClick={onIniciar} disabled={busy}>
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
          )}
          {enProceso && (
            <Button size="sm" onClick={onFinalizar} disabled={busy}>
              <CheckCircle2 className="h-4 w-4" />
              Finalizar
            </Button>
          )}
          {!finalizada && (
            <Button size="sm" variant="outline" onClick={onEvidencia}>
              <Upload className="h-4 w-4" />
              Evidencia
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onChat}>
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onVerDetalle}>
            Ver detalle
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MisAsignacionesPage() {
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const [page, setPage] = useState(0)
  const [evidenciaServicio, setEvidenciaServicio] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")

  const { data, isLoading, isError, refetch } = useMisAsignaciones(idTec, page)
  const iniciar = useIniciarAsignacion()
  const finalizar = useFinalizarAsignacion()
  const abrirChat = useAbrirChatServicio()
  const navigate = useNavigate()
  const busy = iniciar.isPending || finalizar.isPending

  const items = useMemo(() => {
    const all = data?.content ?? []
    return all.filter((a) => {
      const estadoA = asignacionEstado(a).toUpperCase()
      const pasaEstado = !filtroEstado || estadoA === filtroEstado
      const termino = busqueda.trim().toLowerCase()
      const pasaBusqueda =
        !termino ||
        (a.tituloServicio ?? "").toLowerCase().includes(termino) ||
        (a.nombreCliente ?? "").toLowerCase().includes(termino)
      return pasaEstado && pasaBusqueda
    })
  }, [data, filtroEstado, busqueda])

  const hayFiltros = !!busqueda || !!filtroEstado

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mis asignaciones</h1>
        <p className="mt-1 text-muted-foreground">Inicia, finaliza y documenta tus trabajos.</p>
      </header>

      {/* Buscador + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por servicio o cliente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Etiquetas de estado */}
        <div className="flex flex-wrap gap-2">
          {FILTROS_ESTADO.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltroEstado(f.value)}
              className={cn(
                "rounded-full border px-3.5 py-1 text-xs font-semibold transition-all",
                filtroEstado === f.value
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
          {hayFiltros && (
            <button
              type="button"
              onClick={() => { setBusqueda(""); setFiltroEstado("") }}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="mt-4 font-medium">No pudimos cargar tus asignaciones</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">
            {hayFiltros ? "Ninguna asignación coincide con tu búsqueda" : "No tienes asignaciones todavía"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hayFiltros
              ? "Prueba con otro estado o borra los filtros."
              : "Cuando un cliente acepte tu cotización, aparecerá aquí."}
          </p>
          {hayFiltros && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setBusqueda(""); setFiltroEstado("") }}>
              Quitar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {items.length} asignación{items.length !== 1 ? "es" : ""}
            {hayFiltros ? " encontrada" + (items.length !== 1 ? "s" : "") : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <AsignacionCard
                key={a.idAsignacion}
                a={a}
                busy={busy}
                onIniciar={() => iniciar.mutate(a.idAsignacion)}
                onFinalizar={() => finalizar.mutate(a.idAsignacion)}
                onEvidencia={() => setEvidenciaServicio(a.idServicio)}
                onVerDetalle={() =>
                  navigate(paths.tecnico.asignacionDetalle(a.idAsignacion), { state: { asignacion: a } })
                }
                onChat={() =>
                  abrirChat.mutate(a.idServicio, {
                    onSuccess: (id) => navigate(paths.shared.chatConversacion(id)),
                  })
                }
              />
            ))}
          </div>
        </>
      )}

      {data && !hayFiltros && (
        <Pagination
          page={data.number}
          totalPages={data.totalPages}
          first={data.first}
          last={data.last}
          onPageChange={setPage}
        />
      )}

      <EvidenciaUploader
        idServicio={evidenciaServicio}
        open={!!evidenciaServicio}
        onClose={() => setEvidenciaServicio(null)}
      />
    </div>
  )
}
