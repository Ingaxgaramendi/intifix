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
  Pencil,
  Wrench,
  MessageSquare,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EstadoBadge } from "@/components/services/estado-badge"
import { EvidenciaGallery } from "@/components/services/evidencia-gallery"
import { StarRating } from "@/components/shared/star-rating"
import { PerfilLink } from "@/components/shared/perfil-link"
import { UserAvatar } from "@/components/shared/user-avatar"
import { StaticMap } from "@/components/map/static-map"
import { CalificarModal } from "@/features/calificaciones/calificar-modal"
import { Modal } from "@/components/ui/modal"
import { DenunciarModal } from "@/components/shared/denunciar-modal"
import { useAbrirChatServicio } from "@/features/chat/use-chat"
import { EditarServicioModal } from "./editar-servicio-modal"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { paths } from "@/routes/paths"
import type { Calificacion } from "@/types/calificacion"
import {
  asignacionEstado,
  cotizacionComentario,
  cotizacionMonto,
  cotizacionTecnicoId,
  servicioDireccion,
  servicioPresupuesto,
  type Asignacion,
  type Cotizacion,
  type TipoFecha,
} from "@/types/service"

const TIPO_FECHA_LABEL: Record<TipoFecha, string> = {
  URGENTE: "Lo antes posible",
  EXACTA: "Fecha exacta",
  RANGO: "Rango de fechas",
}

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio del cliente",
  EN_TALLER_TECNICO: "En taller del técnico",
}
import {
  useAceptarCotizacion,
  useChangeEstado,
  useDeleteServicio,
  useRechazarCotizacion,
  useEspecialidadesMap,
  useServicioDetalle,
  useTecnicoMini,
  useTecnicoNombre,
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
  const idTec = cotizacionTecnicoId(c)
  const mini = useTecnicoMini(idTec)
  const tecnico = c.nombreTecnico ?? mini.data?.nombre ?? "Técnico"
  const perfilTo = idTec ? paths.cliente.tecnicoPerfil(idTec) : undefined
  const comentario = cotizacionComentario(c)
  const estadoCot = String(c.estado ?? "PENDIENTE").toUpperCase()
  // Only a pending quote on a still-open service can be accepted/rejected.
  const puedeResponder = !disabled && estadoCot === "PENDIENTE"
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <PerfilLink to={perfilTo} className="shrink-0 rounded-full">
            <UserAvatar nombre={tecnico} fotoUrl={mini.data?.foto} size={44} />
          </PerfilLink>
          <div>
            <PerfilLink to={perfilTo} className="font-semibold text-foreground hover:text-primary">
              {tecnico}
            </PerfilLink>
            {c.calificacionTecnico != null && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {c.calificacionTecnico.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(cotizacionMonto(c))}</p>
          {c.estado && <EstadoBadge estado={c.estado} className="mt-1" />}
        </div>
      </div>

      {comentario && <p className="mt-3 text-sm text-muted-foreground">{comentario}</p>}
      {c.tiempoEstimado && (
        <p className="mt-2 text-sm">
          <span className="text-muted-foreground">Tiempo estimado:</span> {c.tiempoEstimado}
        </p>
      )}

      {puedeResponder && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={onAceptar} disabled={busy} className="flex-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Aceptar y asignar
          </Button>
          <Button size="sm" variant="outline" onClick={onRechazar} disabled={busy}>
            <X className="h-4 w-4" />
            Rechazar
          </Button>
        </div>
      )}
    </div>
  )
}

/** Renders a technician's name, resolving it from the id when not embedded. */
function TecnicoNombre({ id, nombre }: { id?: string; nombre?: string }) {
  const { data } = useTecnicoNombre(id)
  return <>{nombre ?? data ?? "Técnico"}</>
}

export function ServicioDetallePage() {
  const { idServicio = "" } = useParams<{ idServicio: string }>()
  const navigate = useNavigate()

  const servicio = useServicioDetalle(idServicio)
  // Detalle embeds cotizaciones/evidencias/asignación; only the address needs a follow-up.
  const ubicacion = useUbicacion(servicio.data?.idUbicacion)
  const especialidades = useEspecialidadesMap()

  const aceptar = useAceptarCotizacion(idServicio)
  const rechazar = useRechazarCotizacion(idServicio)
  const changeEstado = useChangeEstado(idServicio)
  const eliminar = useDeleteServicio()
  const abrirChat = useAbrirChatServicio()
  const [calificarOpen, setCalificarOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [confirmarFinOpen, setConfirmarFinOpen] = useState(false)
  const [denunciarOpen, setDenunciarOpen] = useState(false)

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
  const estadoUpper = String(s.estado).toUpperCase()
  const isClosed = ["FINALIZADO", "CANCELADO"].includes(estadoUpper)
  const cotizaciones = s.cotizaciones ?? []
  const evidencias = s.evidencias ?? []
  // The detalle returns assignment data as flat fields (idAsignacion, idUsuarioTecnico…),
  // not a nested object — rebuild it so the UI can detect "already assigned".
  const asignacion: Asignacion | undefined =
    s.asignacion ??
    (s.idAsignacion
      ? {
          idAsignacion: s.idAsignacion as string,
          idServicio,
          idUsuarioTecnico: s.idUsuarioTecnico as string | undefined,
          estado: s.estado as string,
          fechaAsignacion: s.fechaAsignacion as string | undefined,
        }
      : undefined)
  const idTecAsignado = asignacion?.idUsuarioTecnico ?? asignacion?.idTecnico
  // Quotes can only be accepted while the service is still open for quoting.
  const asignado = !!asignacion || !["PENDIENTE", "COTIZANDO"].includes(estadoUpper)
  const direccion = ubicacion.data?.direccionTexto ?? servicioDireccion(s)
  const especialidad = s.idEspecialidad ? especialidades.get(s.idEspecialidad) : undefined
  const calificacion = s.calificacion as Calificacion | null | undefined
  const finalizado = estadoUpper === "FINALIZADO"
  const enProceso = estadoUpper === "EN_PROCESO"

  // Reglas profesionales:
  // - Editar: solo mientras nadie lo haya tomado (PENDIENTE/COTIZANDO, sin asignar).
  // - Eliminar (borrado real): solo si está PENDIENTE y sin cotizaciones; una vez
  //   que un técnico cotizó/se asignó, ya no se borra: se "Cancela" (deja historial).
  const puedeEditar = !asignado && !isClosed
  const puedeEliminar = estadoUpper === "PENDIENTE" && cotizaciones.length === 0

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

          {/* Service photos */}
          {(s.fotos?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="inline-flex items-center gap-2 font-semibold">
                <ImageIcon className="h-5 w-5 text-primary" />
                Fotos del servicio
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {s.fotos!.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-xl border border-border transition hover:opacity-90"
                  >
                    <img
                      src={url}
                      alt={`Foto ${i + 1} del servicio`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

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
                    disabled={asignado || aceptar.isSuccess}
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
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                <ImageIcon className="h-5 w-5 text-primary" /> Evidencias del trabajo
                <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-medium">
                  {evidencias.length}
                </span>
              </h2>
              <EvidenciaGallery evidencias={evidencias} />
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
                  <Wrench className="h-4 w-4" /> Especialidad
                </dt>
                <dd className="font-medium">{especialidad ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Tag className="h-4 w-4" /> Modalidad
                </dt>
                <dd className="font-medium">
                  {s.modalidad ? MODALIDAD_LABEL[s.modalidad] ?? s.modalidad : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Cuándo
                </dt>
                <dd className="font-medium">
                  {TIPO_FECHA_LABEL[(s.tipoFecha as TipoFecha) ?? "EXACTA"] ?? "—"}
                </dd>
              </div>
              {s.tipoFecha === "EXACTA" && s.fechaProgramada && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground pl-5">Fecha</dt>
                  <dd className="font-medium">{formatDate(s.fechaProgramada)}</dd>
                </div>
              )}
              {s.tipoFecha === "RANGO" && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground pl-5">Ventana</dt>
                  <dd className="font-medium text-right">
                    {formatDate(s.fechaInicioRango)} – {formatDate(s.fechaFinRango)}
                  </dd>
                </div>
              )}
              {(!s.tipoFecha || s.tipoFecha === "EXACTA") && !s.fechaProgramada && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground pl-5">Fecha</dt>
                  <dd className="font-medium">—</dd>
                </div>
              )}
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

          {ubicacion.data?.latitud != null && ubicacion.data?.longitud != null && (
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <StaticMap lat={ubicacion.data.latitud} lng={ubicacion.data.longitud} height={180} />
              {direccion && (
                <p className="flex items-start gap-1.5 px-4 py-3 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {direccion}
                </p>
              )}
            </section>
          )}

          {asignacion && (
            <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <h2 className="inline-flex items-center gap-2 font-semibold text-primary">
                <UserCheck className="h-5 w-5" />
                Técnico asignado
              </h2>
              <p className="mt-2">
                <PerfilLink
                  to={idTecAsignado ? paths.cliente.tecnicoPerfil(idTecAsignado) : undefined}
                  className="font-medium text-foreground hover:text-primary"
                >
                  <TecnicoNombre
                    id={asignacion.idUsuarioTecnico ?? asignacion.idTecnico}
                    nombre={asignacion.nombreTecnico}
                  />
                </PerfilLink>
              </p>
              {asignacionEstado(asignacion) && <EstadoBadge estado={asignacionEstado(asignacion)} className="mt-2" />}
              <Button
                className="mt-4 w-full"
                disabled={abrirChat.isPending}
                onClick={() =>
                  abrirChat.mutate(idServicio, {
                    onSuccess: (id) => navigate(paths.shared.chatConversacion(id)),
                  })
                }
              >
                {abrirChat.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Chatear con el técnico
              </Button>
              {enProceso && (
                <Button
                  variant="outline"
                  className="mt-3 w-full border-success/50 text-success hover:bg-success/10"
                  disabled={changeEstado.isPending}
                  onClick={() => setConfirmarFinOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar servicio finalizado
                </Button>
              )}
              {asignado && !finalizado && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDenunciarOpen(true)}
                >
                  <Flag className="h-3.5 w-3.5" />
                  Denunciar técnico
                </Button>
              )}
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
                <div className="mt-2 flex items-center gap-2">
                  <StarRating value={calificacion.puntuacion} />
                  <span className="text-sm font-medium">{Number(calificacion.puntuacion).toFixed(1)}</span>
                </div>
                {calificacion.comentario && (
                  <p className="mt-3 text-sm text-muted-foreground">“{calificacion.comentario}”</p>
                )}
                {typeof calificacion.recomendaria === "boolean" && (
                  <span
                    className={cn(
                      "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      calificacion.recomendaria
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {calificacion.recomendaria ? "Lo recomiendas" : "No lo recomiendas"}
                  </span>
                )}
              </section>
            ) : (
              <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Star className="h-6 w-6" />
                </span>
                <h2 className="mt-3 font-semibold">¿Cómo te fue con el técnico?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu reseña ayuda a otros clientes a elegir mejor.
                </p>
                <Button className="mt-4 w-full" onClick={() => setCalificarOpen(true)}>
                  <Star className="h-4 w-4" />
                  Calificar técnico
                </Button>
              </section>
            ))}

          {!isClosed && (
            <section className="space-y-2">
              {puedeEditar && (
                <Button variant="outline" className="w-full" onClick={() => setEditarOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Editar servicio
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                disabled={changeEstado.isPending}
                onClick={() => changeEstado.mutate({ estado: "CANCELADO" })}
              >
                Cancelar servicio
              </Button>
              {puedeEliminar ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={eliminar.isPending}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar servicio
                </Button>
              ) : (
                <p className="px-1 text-center text-xs text-muted-foreground">
                  Este servicio ya tiene actividad: no se puede eliminar, solo cancelar.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>

      <CalificarModal
        idServicio={idServicio}
        open={calificarOpen}
        onClose={() => setCalificarOpen(false)}
      />

      <EditarServicioModal servicio={s} open={editarOpen} onClose={() => setEditarOpen(false)} />

      {idTecAsignado && (
        <DenunciarModal
          open={denunciarOpen}
          onClose={() => setDenunciarOpen(false)}
          idServicio={idServicio}
          idReportado={idTecAsignado}
          nombreReportado="el técnico"
        />
      )}

      <Modal
        open={confirmarFinOpen}
        onClose={() => setConfirmarFinOpen(false)}
        title="Confirmar servicio finalizado"
        description="¿Confirmas que el trabajo fue completado satisfactoriamente? Podrás calificar al técnico a continuación."
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmarFinOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={changeEstado.isPending}
            onClick={() => {
              changeEstado.mutate(
                { estado: "FINALIZADO" },
                { onSuccess: () => setConfirmarFinOpen(false) },
              )
            }}
          >
            {changeEstado.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
