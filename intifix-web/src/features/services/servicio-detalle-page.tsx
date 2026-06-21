import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Tag,
  Loader2,
  Trash2,
  Star,
  CheckCircle2,
  X,
  Image as ImageIcon,
  UserCheck,
  CreditCard,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EstadoBadge } from "@/components/services/estado-badge"
import { StarRating } from "@/components/shared/star-rating"
import { CalificarModal } from "@/features/calificaciones/calificar-modal"
import { formatCurrency, formatDate } from "@/lib/format"
import { paths } from "@/routes/paths"
import type { Calificacion } from "@/types/calificacion"
import {
  cotizacionComentario,
  cotizacionMonto,
  cotizacionTecnicoId,
  servicioDireccion,
  servicioPresupuesto,
  type Cotizacion,
} from "@/types/service"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio del cliente",
  EN_TALLER_TECNICO: "En taller del técnico",
}
import {
  useAceptarCotizacion,
  useChangeEstado,
  useDeleteServicio,
  useRechazarCotizacion,
  useServicioDetalle,
  useUbicacion,
} from "./use-services"

function CotizacionCard({
  c,
  onAceptar,
  onRechazar,
  busy,
  disabled,
}: {
  c: Cotizacion
  onAceptar: () => void
  onRechazar: () => void
  busy: boolean
  disabled: boolean
}) {
  const tecnico = c.nombreTecnico ?? cotizacionTecnicoId(c) ?? "Técnico"
  const initials = String(tecnico).slice(0, 2).toUpperCase()
  const comentario = cotizacionComentario(c)
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {initials}
          </span>
          <div>
            <p className="font-semibold">{tecnico}</p>
            {c.calificacionTecnico != null && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {c.calificacionTecnico.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <p className="text-lg font-bold">{formatCurrency(cotizacionMonto(c))}</p>
      </div>

      {comentario && <p className="mt-3 text-sm text-muted-foreground">{comentario}</p>}
      {c.tiempoEstimado && (
        <p className="mt-2 text-sm">
          <span className="text-muted-foreground">Tiempo estimado:</span> {c.tiempoEstimado}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={onAceptar} disabled={busy || disabled} className="flex-1">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Aceptar y asignar
        </Button>
        <Button size="sm" variant="outline" onClick={onRechazar} disabled={busy || disabled}>
          <X className="h-4 w-4" />
          Rechazar
        </Button>
      </div>
    </div>
  )
}

export function ServicioDetallePage() {
  const { idServicio = "" } = useParams<{ idServicio: string }>()
  const navigate = useNavigate()

  const servicio = useServicioDetalle(idServicio)
  // Detalle embeds cotizaciones/evidencias/asignación; only the address needs a follow-up.
  const ubicacion = useUbicacion(servicio.data?.idUbicacion)

  const aceptar = useAceptarCotizacion(idServicio)
  const rechazar = useRechazarCotizacion(idServicio)
  const changeEstado = useChangeEstado(idServicio)
  const eliminar = useDeleteServicio()
  const [calificarOpen, setCalificarOpen] = useState(false)

  if (servicio.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (servicio.isError || !servicio.data) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="mt-4 font-medium">No encontramos este servicio</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.cliente.servicios}>Volver a mis servicios</Link>
        </Button>
      </div>
    )
  }

  const s = servicio.data
  const isClosed = ["FINALIZADO", "CANCELADO"].includes(String(s.estado).toUpperCase())
  const cotizaciones = s.cotizaciones ?? []
  const evidencias = s.evidencias ?? []
  const asignacion = s.asignacion
  const direccion = ubicacion.data?.direccionTexto ?? servicioDireccion(s)
  const calificacion = s.calificacion as Calificacion | null | undefined
  const finalizado = String(s.estado).toUpperCase() === "FINALIZADO"

  const handleDelete = () => {
    if (window.confirm("¿Eliminar este servicio? Esta acción no se puede deshacer.")) {
      eliminar.mutate(idServicio, { onSuccess: () => navigate(paths.cliente.servicios) })
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to={paths.cliente.servicios}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis servicios
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{s.titulo}</h1>
            <EstadoBadge estado={s.estado} />
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Descripción</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{s.descripcion}</p>
          </section>

          {/* Quotes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cotizaciones recibidas</h2>
              {cotizaciones.length > 0 && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium">
                  {cotizaciones.length}
                </span>
              )}
            </div>

            {cotizaciones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Aún no hay cotizaciones. Los técnicos cercanos las enviarán pronto.
              </div>
            ) : (
              <div className="space-y-3">
                {cotizaciones.map((c) => (
                  <CotizacionCard
                    key={c.idCotizacion}
                    c={c}
                    busy={aceptar.isPending || rechazar.isPending}
                    disabled={isClosed || !!asignacion}
                    onAceptar={() =>
                      aceptar.mutate({
                        idCotizacion: c.idCotizacion,
                        idUsuarioTecnico: cotizacionTecnicoId(c),
                      })
                    }
                    onRechazar={() => rechazar.mutate(c.idCotizacion)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Evidence */}
          {evidencias.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Evidencias</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {evidencias.map((e) => (
                  <a
                    key={e.idEvidencia}
                    href={e.urlArchivo}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    {e.urlArchivo && e.tipoArchivo === "IMAGEN" ? (
                      <img
                        src={e.urlArchivo}
                        alt={e.descripcion ?? "Evidencia"}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Resumen</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Tag className="h-4 w-4" /> Modalidad
                </dt>
                <dd className="font-medium">
                  {s.modalidad ? MODALIDAD_LABEL[s.modalidad] ?? s.modalidad : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Prioridad</dt>
                <dd className="font-medium capitalize">{s.prioridad?.toLowerCase() ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Programado
                </dt>
                <dd className="font-medium">{formatDate(s.fechaProgramada)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Dirección
                </dt>
                <dd className="text-right font-medium">{direccion ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="text-muted-foreground">Presupuesto</dt>
                <dd className="text-base font-bold">{formatCurrency(servicioPresupuesto(s))}</dd>
              </div>
            </dl>
          </section>

          {asignacion && (
            <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <h2 className="inline-flex items-center gap-2 font-semibold text-primary">
                <UserCheck className="h-5 w-5" />
                Técnico asignado
              </h2>
              <p className="mt-2 font-medium">
                {asignacion.nombreTecnico ?? asignacion.idUsuarioTecnico ?? asignacion.idTecnico ?? "Técnico"}
              </p>
              {asignacion.estado && <EstadoBadge estado={asignacion.estado} className="mt-2" />}
            </section>
          )}

          {asignacion && (
            <Button asChild className="w-full">
              <Link to={paths.cliente.pago(idServicio)}>
                <CreditCard className="h-4 w-4" />
                Pagar servicio
              </Link>
            </Button>
          )}

          {/* Rating: only on finished services */}
          {finalizado &&
            (calificacion?.puntuacion ? (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-semibold">Tu calificación</h2>
                <StarRating value={calificacion.puntuacion} className="mt-2" />
                {calificacion.comentario && (
                  <p className="mt-3 text-sm text-muted-foreground">“{calificacion.comentario}”</p>
                )}
              </section>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setCalificarOpen(true)}>
                <Star className="h-4 w-4" />
                Calificar técnico
              </Button>
            ))}

          {!isClosed && (
            <section className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                disabled={changeEstado.isPending}
                onClick={() => changeEstado.mutate({ estado: "CANCELADO" })}
              >
                Cancelar servicio
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                disabled={eliminar.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar servicio
              </Button>
            </section>
          )}
        </aside>
      </div>

      <CalificarModal
        idServicio={idServicio}
        open={calificarOpen}
        onClose={() => setCalificarOpen(false)}
      />
    </div>
  )
}
