import { useState, type ReactNode } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import {
  ArrowLeft,
  Clock,
  Calendar,
  MapPin,
  Wrench,
  User,
  Maximize2,
  Loader2,
  MessageSquare,
  XCircle,
  FileText,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { EstadoBadge } from "@/components/services/estado-badge"
import { StaticMap } from "@/components/map/static-map"
import { UserAvatar } from "@/components/shared/user-avatar"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { paths } from "@/routes/paths"
import { useClienteMini, useServicioDetalle, useUbicacion } from "@/features/services/use-services"
import { useAbrirChatServicio } from "@/features/chat/use-chat"
import { useCancelarCotizacion } from "./use-technician"
import {
  cotizacionComentario,
  cotizacionMonto,
  servicioDireccion,
  type Cotizacion,
} from "@/types/service"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio",
  EN_TALLER_TECNICO: "En taller",
}

function Galeria({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [activa, setActiva] = useState(0)
  const [verLightbox, setVerLightbox] = useState(false)
  if (!fotos.length) return null
  const idx = Math.min(activa, fotos.length - 1)
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setVerLightbox(true)}
        aria-label="Ver imagen en pantalla completa"
        className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-muted"
      >
        <img src={fotos[idx]} alt={titulo} className="h-full w-full object-cover" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-foreground/70 px-2 py-1 text-xs font-medium text-background opacity-0 transition group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" /> Ampliar
        </span>
      </button>
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((url, i) => (
            <button
              type="button"
              key={url}
              onClick={() => setActiva(i)}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {verLightbox && (
        <ImageLightbox
          fotos={fotos}
          index={idx}
          alt={titulo}
          onIndexChange={setActiva}
          onClose={() => setVerLightbox(false)}
        />
      )}
    </div>
  )
}

function DatoCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

export function CotizacionDetallePage() {
  const { idServicio, idCotizacion } = useParams<{ idServicio: string; idCotizacion: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const abrirChat = useAbrirChatServicio()
  const cancelar = useCancelarCotizacion()

  const { data: servicio, isLoading } = useServicioDetalle(idServicio ?? "")

  // La cotización viene por state desde la lista; si no (deep-link/refresh),
  // la buscamos dentro del detalle del servicio.
  const cotizacionState = (location.state as { cotizacion?: Cotizacion } | null)?.cotizacion
  const cotizacion: Cotizacion | undefined =
    cotizacionState ?? servicio?.cotizaciones?.find((c) => c.idCotizacion === idCotizacion)

  const esDomicilio = servicio?.modalidad === "EN_CASA_CLIENTE"
  const ubic = useUbicacion(esDomicilio ? servicio?.idUbicacion : undefined)
  const direccion = ubic.data?.direccionTexto ?? (servicio ? servicioDireccion(servicio) : undefined)
  const clienteMini = useClienteMini(servicio?.idCliente)

  if (isLoading || !servicio) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  const estado = cotizacion?.estado ?? "PENDIENTE"
  const pendiente = String(estado).toUpperCase() === "PENDIENTE"
  const comentario = cotizacion ? cotizacionComentario(cotizacion) : undefined
  const nombreCliente = servicio.nombreCliente ?? clienteMini.data?.nombre ?? "Cliente"

  const irAlChat = () =>
    abrirChat.mutate(servicio.idServicio, {
      onSuccess: (idConv) => navigate(paths.shared.chatConversacion(idConv)),
    })

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <button
        onClick={() => navigate(paths.tecnico.cotizaciones)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Mis cotizaciones
      </button>

      {/* Resumen de la cotización */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 p-5">
          <div>
            <p className="text-xs text-muted-foreground">Tu cotización</p>
            <p className="text-3xl font-bold">{formatCurrency(cotizacion ? cotizacionMonto(cotizacion) : undefined)}</p>
          </div>
          <EstadoBadge estado={estado} className="text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {cotizacion?.tiempoEstimado && (
            <DatoCard icon={<Clock className="h-3.5 w-3.5" />} label="Tiempo estimado" value={cotizacion.tiempoEstimado} />
          )}
          <DatoCard
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Enviada"
            value={formatDate(cotizacion?.fechaEnvio ?? cotizacion?.fechaCreacion)}
          />
          {cotizacion?.fechaRespuesta && (
            <DatoCard icon={<Calendar className="h-3.5 w-3.5" />} label="Respondida" value={formatDate(cotizacion.fechaRespuesta)} />
          )}
        </div>
        {comentario && (
          <div className="px-5 pb-5">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Tu mensaje
            </p>
            <p className="rounded-xl bg-muted/40 p-3 text-sm">{comentario}</p>
          </div>
        )}
        {cotizacion?.motivoRechazo && (
          <div className="px-5 pb-5">
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Motivo de rechazo: {cotizacion.motivoRechazo}
            </p>
          </div>
        )}
      </div>

      {/* Cliente */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <UserAvatar nombre={nombreCliente} fotoUrl={clienteMini.data?.foto} size={44} />
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-semibold">{nombreCliente}</p>
          </div>
        </div>
        {servicio.idCliente && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(paths.tecnico.clientePerfil(servicio.idCliente), {
                state: { idServicio: servicio.idServicio },
              })
            }
          >
            <User className="h-4 w-4" /> Ver perfil
          </Button>
        )}
      </div>

      {/* Detalle del servicio */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{servicio.titulo}</h2>
          <EstadoBadge estado={servicio.estado} />
        </div>

        <Galeria fotos={servicio.fotos ?? []} titulo={servicio.titulo} />

        <p className="whitespace-pre-line text-sm text-muted-foreground">{servicio.descripcion}</p>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {servicio.modalidad && (
            <DatoCard
              icon={<Wrench className="h-3.5 w-3.5" />}
              label="Modalidad"
              value={MODALIDAD_LABEL[servicio.modalidad] ?? servicio.modalidad}
            />
          )}
          {servicio.fechaProgramada && (
            <DatoCard
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Programada"
              value={formatDateTime(servicio.fechaProgramada)}
            />
          )}
          <DatoCard
            icon={<Wallet className="h-3.5 w-3.5" />}
            label="Presupuesto máx."
            value={formatCurrency(servicio.presupuestoMaximo)}
          />
        </div>

        {direccion && (
          <p className="inline-flex items-center gap-1.5 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            {direccion}
          </p>
        )}
        {esDomicilio && ubic.data?.latitud != null && ubic.data?.longitud != null && (
          <StaticMap lat={ubic.data.latitud} lng={ubic.data.longitud} height={180} className="overflow-hidden rounded-2xl" />
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={irAlChat} disabled={abrirChat.isPending} className="flex-1 sm:flex-none">
          {abrirChat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          Chat con el cliente
        </Button>
        {pendiente && cotizacion && (
          <Button
            variant="outline"
            onClick={() =>
              cancelar.mutate(cotizacion.idCotizacion, {
                onSuccess: () => navigate(paths.tecnico.cotizaciones),
              })
            }
            disabled={cancelar.isPending}
          >
            {cancelar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Cancelar cotización
          </Button>
        )}
      </div>
    </div>
  )
}
