import { useState } from "react"
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"
import {
  ArrowLeft,
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
  ImageIcon,
  Clock,
  CircleDot,
  Loader2,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { EstadoBadge } from "@/components/services/estado-badge"
import { PerfilLink } from "@/components/shared/perfil-link"
import { EvidenciaGallery } from "@/components/services/evidencia-gallery"
import { EvidenciaUploader } from "@/components/services/evidencia-uploader"
import { StaticMap } from "@/components/map/static-map"
import { useAuthStore } from "@/stores/auth-store"
import { useAbrirChatServicio } from "@/features/chat/use-chat"
import { useServicioDetalle, useUbicacion } from "@/features/services/use-services"
import { paths } from "@/routes/paths"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { asignacionEstado, servicioDireccion, type Asignacion, type Evidencia } from "@/types/service"
import { useFinalizarAsignacion, useIniciarAsignacion, useMiAsignacion } from "./use-technician"
import { DenunciarModal } from "@/components/shared/denunciar-modal"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio del cliente",
  EN_TALLER_TECNICO: "En taller del técnico",
}

/** Línea de tiempo del trabajo: asignado → iniciado → finalizado. */
function Timeline({ a, finalizado }: { a: Asignacion; finalizado: boolean }) {
  const pasos = [
    { label: "Asignado", fecha: a.fechaAsignacion, done: true },
    { label: "Iniciado", fecha: a.fechaInicioReal, done: !!a.fechaInicioReal || finalizado },
    { label: "Finalizado", fecha: a.fechaFinReal, done: finalizado },
  ]
  return (
    <ol className="space-y-4">
      {pasos.map((p, i) => (
        <li key={p.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2",
                p.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              {p.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDot className="h-3 w-3" />}
            </span>
            {i < pasos.length - 1 && (
              <span className={cn("mt-1 h-8 w-0.5", p.done ? "bg-primary/40" : "bg-border")} />
            )}
          </div>
          <div className="pb-1">
            <p className={cn("text-sm font-medium", !p.done && "text-muted-foreground")}>{p.label}</p>
            <p className="text-xs text-muted-foreground">
              {p.fecha ? formatDateTime(p.fecha) : p.done ? "—" : "Pendiente"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function AsignacionDetallePage() {
  const { idAsignacion = "" } = useParams<{ idAsignacion: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const idTec = useAuthStore((s) => s.user?.idUsuario)

  // `fromState` da render instantáneo al venir de la lista; la query es la fuente
  // de verdad (se refresca al iniciar/finalizar) y cubre el refresco de página.
  const fromState = (location.state as { asignacion?: Asignacion } | null)?.asignacion
  const query = useMiAsignacion(idTec, idAsignacion)
  const a = query.data ?? fromState ?? undefined

  const servicio = useServicioDetalle(a?.idServicio ?? "")
  const ubicacion = useUbicacion(servicio.data?.idUbicacion)
  const iniciar = useIniciarAsignacion()
  const finalizar = useFinalizarAsignacion()
  const abrirChat = useAbrirChatServicio()
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const [confirmFin, setConfirmFin] = useState(false)
  const [denunciarOpen, setDenunciarOpen] = useState(false)

  if (query.isLoading && !fromState) {
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

  if (!a) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="mt-4 font-medium">No encontramos esta asignación</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.tecnico.asignaciones}>Volver a mis asignaciones</Link>
        </Button>
      </div>
    )
  }

  const s = servicio.data
  const estado = asignacionEstado(a).toUpperCase()
  const finalizada = ["FINALIZADO", "COMPLETADO", "CANCELADO"].includes(estado)
  const enProceso = ["EN_PROCESO", "EN_PROGRESO", "INICIADO"].includes(estado)
  const evidencias = (s?.evidencias ?? []) as Evidencia[]
  const direccion = ubicacion.data?.direccionTexto ?? (s ? servicioDireccion(s) : undefined)
  const busy = iniciar.isPending || finalizar.isPending

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to={paths.tecnico.asignaciones}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Mis asignaciones
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {servicio.isLoading ? (
            <Skeleton className="h-8 w-56" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{s?.titulo ?? "Servicio"}</h1>
          )}
          <EstadoBadge estado={asignacionEstado(a)} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Descripción */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Descripción del trabajo</h2>
            {servicio.isLoading ? (
              <Skeleton className="mt-2 h-16 w-full rounded" />
            ) : (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {s?.descripcion ?? "—"}
              </p>
            )}
          </section>

          {/* Fotos del servicio (lo que envió el cliente) */}
          {(s?.fotos?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="inline-flex items-center gap-2 font-semibold">
                <ImageIcon className="h-5 w-5 text-primary" /> Fotos del cliente
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {s!.fotos!.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square overflow-hidden rounded-xl border border-border transition hover:opacity-90"
                  >
                    <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Evidencias del trabajo */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 font-semibold">
                <Upload className="h-5 w-5 text-primary" /> Evidencias del trabajo
                {evidencias.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-medium">
                    {evidencias.length}
                  </span>
                )}
              </h2>
              {!finalizada && (
                <Button size="sm" variant="outline" onClick={() => setUploaderOpen(true)}>
                  <Upload className="h-4 w-4" /> Subir
                </Button>
              )}
            </div>
            {evidencias.length > 0 ? (
              <div className="mt-4">
                <EvidenciaGallery evidencias={evidencias} />
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Aún no subiste evidencias. Documenta el antes y después del trabajo.
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Cliente */}
          {(s?.nombreCliente || s?.idCliente) && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Cliente</h2>
              <PerfilLink
                to={s?.idCliente ? paths.tecnico.clientePerfil(s.idCliente) : undefined}
                state={{ idServicio: a.idServicio }}
                className="mt-2 inline-flex items-center gap-2 font-medium text-foreground hover:text-primary"
              >
                <User className="h-4 w-4" /> {s?.nombreCliente ?? "Ver perfil del cliente"}
              </PerfilLink>
              <Button
                className="mt-4 w-full"
                disabled={abrirChat.isPending}
                onClick={() =>
                  abrirChat.mutate(a.idServicio, {
                    onSuccess: (id) => navigate(paths.shared.chatConversacion(id)),
                  })
                }
              >
                {abrirChat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Chatear con el cliente
              </Button>
              {!finalizada && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDenunciarOpen(true)}
                >
                  <Flag className="h-3.5 w-3.5" />
                  Denunciar cliente
                </Button>
              )}
            </section>
          )}

          {/* Resumen */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Resumen</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {s?.modalidad && (
                <div className="flex items-center justify-between">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Tag className="h-4 w-4" /> Modalidad
                  </dt>
                  <dd className="font-medium">{MODALIDAD_LABEL[s.modalidad] ?? s.modalidad}</dd>
                </div>
              )}
              {s?.fechaProgramada && (
                <div className="flex items-center justify-between">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Programado
                  </dt>
                  <dd className="font-medium">{formatDateTime(s.fechaProgramada)}</dd>
                </div>
              )}
              {s?.presupuestoMaximo != null && (
                <div className="flex items-center justify-between">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Wallet className="h-4 w-4" /> Presupuesto
                  </dt>
                  <dd className="font-bold">{formatCurrency(s.presupuestoMaximo)}</dd>
                </div>
              )}
              {direccion && (
                <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Dirección
                  </dt>
                  <dd className="text-right font-medium">{direccion}</dd>
                </div>
              )}
            </dl>
          </section>

          {ubicacion.data?.latitud != null && ubicacion.data?.longitud != null && (
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <StaticMap lat={ubicacion.data.latitud} lng={ubicacion.data.longitud} height={170} />
            </section>
          )}

          {/* Línea de tiempo */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="inline-flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5 text-primary" /> Progreso
            </h2>
            <div className="mt-4">
              <Timeline a={a} finalizado={finalizada} />
            </div>
          </section>

          {/* Acciones */}
          {!finalizada && (
            <section className="space-y-2">
              {!enProceso ? (
                <Button className="w-full" disabled={busy} onClick={() => iniciar.mutate(a.idAsignacion)}>
                  {iniciar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Iniciar trabajo
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full"
                    disabled={busy || evidencias.length === 0}
                    onClick={() => setConfirmFin(true)}
                  >
                    {finalizar.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Finalizar trabajo
                  </Button>
                  {evidencias.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Sube al menos una evidencia del trabajo para poder finalizar
                    </p>
                  )}
                </>
              )}
              <Button variant="outline" className="w-full" onClick={() => setUploaderOpen(true)}>
                <Upload className="h-4 w-4" /> Subir evidencia
              </Button>
            </section>
          )}

          {finalizada && (
            <div className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/5 p-4 text-sm text-success">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Trabajo finalizado. El cliente podrá calificarte.
            </div>
          )}
        </aside>
      </div>

      <EvidenciaUploader
        idServicio={uploaderOpen ? a.idServicio : null}
        open={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
      />

      <Modal
        open={confirmFin}
        onClose={() => setConfirmFin(false)}
        title="Finalizar trabajo"
        description="Confirma que terminaste el servicio. El cliente recibirá la opción de calificarte."
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmFin(false)} disabled={finalizar.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              finalizar.mutate(a.idAsignacion, { onSuccess: () => setConfirmFin(false) })
            }
            disabled={finalizar.isPending}
          >
            {finalizar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Sí, finalizar
          </Button>
        </div>
      </Modal>

      {s?.idCliente && (
        <DenunciarModal
          open={denunciarOpen}
          onClose={() => setDenunciarOpen(false)}
          idServicio={a.idServicio}
          idReportado={s.idCliente as string}
          nombreReportado={s.nombreCliente ?? "el cliente"}
        />
      )}
    </div>
  )
}
