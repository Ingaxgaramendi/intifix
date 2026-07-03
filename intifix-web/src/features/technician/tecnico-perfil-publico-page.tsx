import { useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  Wrench,
  MapPin,
  Briefcase,
  Award,
  ThumbsUp,
  ShieldCheck,
  Clock,
  Sparkles,
  Phone,
  Info,
  Store,
  CalendarDays,
  FileCheck2,
  Wallet,
  Flag,
  MessageSquare,
  UserCheck,
  Eye,
  Download,
  X,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/shared/star-rating"
import { PerfilLink } from "@/components/shared/perfil-link"
import { StaticMap } from "@/components/map/static-map"
import { Reveal, RevealGroup, RevealItem } from "@/components/public/reveal"
import { CountUp } from "@/components/public/count-up"
import { cn, toViewableUrl } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/format"
import { haversineKm, formatKm } from "@/lib/geo"
import { paths } from "@/routes/paths"
import { useAuthStore } from "@/stores/auth-store"
import { useClienteProfile } from "@/features/profile/use-cliente-profile"
import { useUbicacion, useClienteNombre } from "@/features/services/use-services"
import {
  useCalificacionesTecnico,
  usePromedioPuntuacion,
  useTotalCalificaciones,
} from "@/features/calificaciones/use-calificaciones"
import { type Calificacion } from "@/types/calificacion"
import { useMisEspecialidades } from "@/features/profile/use-tecnico-profile"
import { useHorarios } from "@/features/technician/use-agenda"
import { useTecnicoServiciosCount } from "@/features/technician/use-technician"
import {
  tecnicoCalificacion,
  tecnicoCoords,
  tecnicoNombre,
  tecnicoTarifa,
  DIAS_SEMANA,
  type Tecnico,
} from "@/types/technician"
import { useTecnicoDetalle } from "@/features/search/use-buscar-tecnicos"
import { DenunciarModal } from "@/components/shared/denunciar-modal"
import { chatApi } from "@/api/chat"

/** Avatar con anillo cónico vino→dorado que gira lento; distingue el perfil. */
function Avatar({ t, size = 116 }: { t: Tecnico; size?: number }) {
  const nombre = tecnicoNombre(t)
  const inner = t.fotoPerfilUrl ? (
    <img
      src={t.fotoPerfilUrl}
      alt={nombre}
      style={{ width: size, height: size }}
      className="block rounded-full border-4 border-card object-cover"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full border-4 border-card bg-primary/10 text-3xl font-bold text-primary"
    >
      {nombre.slice(0, 2).toUpperCase()}
    </span>
  )
  return (
    <span className="relative inline-block shrink-0 rounded-full p-[3px] shadow-xl">
      <span className="animate-spin-slow absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--primary),var(--warning),var(--primary))]" />
      <span className="relative block rounded-full">{inner}</span>
    </span>
  )
}

const STAT_TONES = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
} as const

function Stat({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  tone?: keyof typeof STAT_TONES
}) {
  return (
    <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110",
          STAT_TONES[tone],
        )}
      >
        {icon}
      </span>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/** Encabezado de sección con ícono dentro de un chip de color. */
function SectionHeader({
  icon,
  children,
  tone = "primary",
}: {
  icon: ReactNode
  children: ReactNode
  tone?: keyof typeof STAT_TONES
}) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", STAT_TONES[tone])}>{icon}</span>
      {children}
    </p>
  )
}

/** Tarjeta de sección con borde, hover sutil y reveal al entrar en viewport. */
function SectionCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <Reveal from="up" delay={delay}>
      <div
        className={cn(
          "rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg dark:hover:border-primary/50 dark:hover:shadow-xl",
          className,
        )}
      >
        {children}
      </div>
    </Reveal>
  )
}

/** Una reseña con el nombre del cliente (no anónima): lo resuelve por idCliente. */
function ReviewItem({ c, linkable }: { c: Calificacion; linkable: boolean }) {
  const { data: nombreResuelto } = useClienteNombre(c.nombreCliente ? undefined : c.idCliente)
  const nombre = c.nombreCliente ?? nombreResuelto ?? "Cliente"
  // Solo un técnico (viendo su propio perfil) puede abrir el perfil del cliente.
  const perfilTo = linkable && c.idCliente ? paths.tecnico.clientePerfil(c.idCliente) : undefined
  return (
    <div className="rounded-xl border border-border p-4 transition-colors hover:border-primary/20 hover:bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <PerfilLink to={perfilTo} state={{ idServicio: c.idServicio }} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {nombre.slice(0, 2).toUpperCase()}
          </span>
          <span className="text-sm font-medium">{nombre}</span>
        </PerfilLink>
        <StarRating value={c.puntuacion} size={14} />
      </div>
      {c.comentario && <p className="mt-2 text-sm text-muted-foreground">“{c.comentario}”</p>}
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        {(c.fechaCalificacion ?? c.fechaCreacion) && (
          <span>{formatDate(c.fechaCalificacion ?? c.fechaCreacion)}</span>
        )}
        {c.recomendaria && (
          <span className="inline-flex items-center gap-1 text-success">
            <ThumbsUp className="h-3 w-3" /> Recomienda
          </span>
        )}
      </div>
    </div>
  )
}

export function TecnicoPerfilPublicoPage() {
  const { idTecnico: paramId } = useParams<{ idTecnico: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [denunciarOpen, setDenunciarOpen] = useState(false)
  const [viewingCert, setViewingCert] = useState<{ src: string; title: string } | null>(null)
  // idServicio en state → viene desde un servicio compartido (asignación/detalle)
  const idServicioCtx = (location.state as { idServicio?: string } | null)?.idServicio
  // Sin :idTecnico en la URL = el técnico está viendo SU propio perfil público.
  const idTecnico = paramId ?? user?.idUsuario
  const esPropio = !!idTecnico && idTecnico === user?.idUsuario

  const { data: t, isLoading } = useTecnicoDetalle(idTecnico ?? null)
  const consulta = useMutation({
    mutationFn: () => chatApi.crearConsulta(idTecnico!),
    onSuccess: (conv) => navigate(paths.shared.chatConversacion(conv.idConversacion ?? (conv.id as string))),
    onError: () => toast.error("No se pudo iniciar la consulta"),
  })
  const { data: reviews = [] } = useCalificacionesTecnico(idTecnico ?? undefined, 0)
  // Rating/total reales (AVG y COUNT en BD): el /detalle no los trae y la
  // reputación cacheada queda en 0 (el backend no la actualiza al calificar).
  const { data: promedio } = usePromedioPuntuacion(idTecnico ?? undefined)
  const { data: totalCalif } = useTotalCalificaciones(idTecnico ?? undefined)
  const { data: serviciosCount } = useTecnicoServiciosCount(idTecnico ?? undefined)

  // Especialidades reales del técnico (el /detalle no las puebla); traen certificadoUrl.
  const espQuery = useMisEspecialidades(idTecnico ?? "")
  // Ubicación/taller del técnico (dirección + distrito) para la tarjeta de contacto.
  const ubicTaller = useUbicacion(t?.idUbicacion)
  // Horario de atención (agenda semanal).
  const horariosQuery = useHorarios(idTecnico ?? "")

  // Distancia a la ubicación guardada del cliente (si la tiene).
  // Solo aplica cuando un CLIENTE consulta el perfil de otro técnico: pedir el
  // perfil de cliente del propio técnico daría un 404 "Cliente no encontrado".
  const esCliente = !esPropio && !!user?.roles?.includes("CLIENTE")
  const cliente = useClienteProfile(esCliente ? user?.idUsuario : undefined)
  const ubicCliente = useUbicacion(esCliente ? cliente.data?.idUbicacion : undefined)

  const distancia = useMemo(() => {
    const coordsTec = t ? tecnicoCoords(t) : null
    const lat = ubicCliente.data?.latitud
    const lng = ubicCliente.data?.longitud
    if (!coordsTec || lat == null || lng == null) return null
    return haversineKm({ lat, lng }, coordsTec)
  }, [t, ubicCliente.data])

  if (isLoading || !t) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  const nombre = tecnicoNombre(t)
  // Promedio de las reseñas cargadas: último recurso si la reputación agregada
  // aún no existe (p.ej. con una sola calificación recién hecha).
  const reviewsAvg = reviews.length
    ? reviews.reduce((acc, r) => acc + (r.puntuacion ?? 0), 0) / reviews.length
    : undefined
  const rating = promedio ?? reviewsAvg ?? tecnicoCalificacion(t)
  const totalReviews = totalCalif ?? reviews.length
  const servicios = serviciosCount ?? t.totalServicios ?? undefined
  const especialidades = espQuery.data ?? []
  const coords = tecnicoCoords(t)
  const tallerDireccion = ubicTaller.data?.direccionTexto
  const tallerZona = [ubicTaller.data?.distrito, ubicTaller.data?.provincia].filter(Boolean).join(", ")
  const horariosPorDia = DIAS_SEMANA.map((dia, idx) => ({
    dia,
    bloques: (horariosQuery.data ?? [])
      .filter((h) => h.activo && h.diaSemana === idx)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
  })).filter((d) => d.bloques.length > 0)
  const aprobado = t.estadoAprobacion === "APROBADO"
  const topRated = (rating ?? 0) >= 4.5 && totalReviews >= 3
  const recomiendan = reviews.length
    ? Math.round((reviews.filter((r) => r.recomendaria).length / reviews.length) * 100)
    : null

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {/* Cover + identidad */}
      <Reveal from="up" className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Portada vino con textura, sheen en movimiento y blobs flotantes. */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary via-primary/85 to-primary/50 sm:h-40">
          <div className="cover-dots absolute inset-0 opacity-70" />
          <div className="cover-sheen animate-wine-pan absolute inset-0" />
          <div className="animate-float-slow absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div
            className="animate-float-slow absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-white/10 blur-3xl"
            style={{ animationDelay: "2.5s" }}
          />
          <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-2">
            {aprobado && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <BadgeCheck className="h-3.5 w-3.5" /> Verificado
              </span>
            )}
            {topRated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> Top rated
              </span>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="relative -mt-16 w-fit">
            <Avatar t={t} />
            {t.disponibilidad && (
              <span
                className={cn(
                  "absolute bottom-2 right-2 h-5 w-5 rounded-full border-[3px] border-card",
                  t.disponibilidad === "DISPONIBLE" ? "bg-success" : "bg-muted-foreground",
                )}
                title={t.disponibilidad === "DISPONIBLE" ? "Disponible ahora" : "Ocupado"}
              />
            )}
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight">{nombre}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {rating != null ? (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    {rating.toFixed(1)}
                    <span className="text-muted-foreground">({totalReviews})</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin reseñas aún</span>
                )}
                {t.disponibilidad && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      t.disponibilidad === "DISPONIBLE" ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        t.disponibilidad === "DISPONIBLE" ? "bg-success" : "bg-muted-foreground",
                      )}
                    />
                    {t.disponibilidad === "DISPONIBLE" ? "Disponible" : "Ocupado"}
                  </span>
                )}
                {distancia != null && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> a {formatKm(distancia)} de ti
                  </span>
                )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RevealItem>
          <Stat
            icon={<Briefcase className="h-5 w-5" />}
            label="Años de experiencia"
            tone="primary"
            value={t.experienciaAnios != null ? <CountUp to={t.experienciaAnios} /> : "—"}
          />
        </RevealItem>
        <RevealItem>
          <Stat
            icon={<Award className="h-5 w-5" />}
            label="Servicios"
            tone="info"
            value={servicios != null ? <CountUp to={servicios} /> : "—"}
          />
        </RevealItem>
        <RevealItem>
          <Stat
            icon={<Star className="h-5 w-5" />}
            label="Calificación"
            tone="warning"
            value={rating != null ? rating.toFixed(1) : "—"}
          />
        </RevealItem>
        <RevealItem>
          <Stat
            icon={<ThumbsUp className="h-5 w-5" />}
            label="Recomiendan"
            tone="success"
            value={recomiendan != null ? <CountUp to={recomiendan} suffix="%" /> : "—"}
          />
        </RevealItem>
      </RevealGroup>

      {/* Tarifa + especialidades */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-warning/5">
          <Wallet className="absolute -bottom-3 -right-3 h-20 w-20 text-primary/5" />
          <p className="text-sm text-muted-foreground">Tarifa base</p>
          <p className="text-gradient-wine mt-1 text-3xl font-bold">{formatCurrency(tecnicoTarifa(t))}</p>
          <p className="mt-1 text-xs text-muted-foreground">Referencial; cada servicio se cotiza aparte.</p>
        </SectionCard>
        <SectionCard delay={0.06}>
          <SectionHeader icon={<Wrench className="h-4 w-4" />}>Especialidades</SectionHeader>
          {espQuery.isLoading ? (
            <Skeleton className="h-6 w-40 rounded-full" />
          ) : especialidades.length ? (
            <div className="flex flex-wrap gap-1.5">
              {especialidades.map((e) =>
                e.certificadoUrl ? (
                  <button
                    key={e.idEspecialidad}
                    type="button"
                    onClick={() => setViewingCert({ src: e.certificadoUrl!, title: `Certificado — ${e.nombre}` })}
                    className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success transition-all duration-200 hover:scale-105 hover:bg-success/25 hover:ring-1 hover:ring-success/40"
                    title="Ver certificado"
                  >
                    <FileCheck2 className="h-3 w-3" />
                    {e.nombre}
                    <span className="opacity-80">· Certificado</span>
                    <Eye className="h-3 w-3 opacity-60" />
                  </button>
                ) : (
                  <span
                    key={e.idEspecialidad}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-transform duration-200 hover:scale-105"
                  >
                    {e.nombre}
                  </span>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No registró especialidades.</p>
          )}
        </SectionCard>
      </div>

      {/* Acerca de */}
      {t.descripcion && (
        <SectionCard>
          <SectionHeader icon={<Info className="h-4 w-4" />}>Acerca de {nombre.split(" ")[0]}</SectionHeader>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{t.descripcion}</p>
        </SectionCard>
      )}

      {/* Contacto y taller */}
      {(t.telefonoContacto || tallerDireccion || coords) && (
        <SectionCard>
          <SectionHeader icon={<Store className="h-4 w-4" />} tone="info">
            Taller y contacto
          </SectionHeader>
          <div className="space-y-2 text-sm">
            {t.telefonoContacto && (
              <a
                href={`tel:${t.telefonoContacto}`}
                className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
              >
                <Phone className="h-4 w-4" /> {t.telefonoContacto}
              </a>
            )}
            {(tallerDireccion || tallerZona) && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {tallerDireccion && <span className="text-foreground">{tallerDireccion}</span>}
                  {tallerDireccion && tallerZona && " · "}
                  {tallerZona}
                </span>
              </p>
            )}
            <p className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" /> Miembro desde {formatDate(t.creadoEn as string)}
            </p>
          </div>
          {coords && (
            <StaticMap lat={coords.lat} lng={coords.lng} height={200} className="mt-3 overflow-hidden rounded-2xl" />
          )}
        </SectionCard>
      )}

      {/* Horario de atención */}
      {horariosPorDia.length > 0 && (
        <SectionCard>
          <SectionHeader icon={<Clock className="h-4 w-4" />} tone="success">
            Horario de atención
          </SectionHeader>
          <div className="space-y-1 text-sm">
            {horariosPorDia.map(({ dia, bloques }) => (
              <div
                key={dia}
                className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span className="font-medium">{dia}</span>
                <span className="text-right text-muted-foreground">
                  {bloques.map((b) => `${b.horaInicio.slice(0, 5)}–${b.horaFin.slice(0, 5)}`).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Reseñas */}
      <SectionCard>
        <p className="mb-4 flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          Reseñas de clientes
          {reviews.length > 0 && <span className="text-muted-foreground">({reviews.length})</span>}
        </p>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este técnico aún no tiene reseñas.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((c, i) => (
              <ReviewItem key={c.idCalificacion ?? i} c={c} linkable={esPropio} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* CTA sticky */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="hidden flex-1 items-center gap-2 text-sm text-muted-foreground sm:flex">
            <Clock className="h-4 w-4" />
            {esPropio
              ? "Así ven los clientes tu perfil público."
              : `Pide un servicio y ${nombre.split(" ")[0]} te enviará una cotización.`}
          </div>
          {esPropio ? (
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate(paths.tecnico.perfil)}>
              Editar mi perfil
            </Button>
          ) : (
            <>
              {idServicioCtx && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDenunciarOpen(true)}
                >
                  <Flag className="h-4 w-4" />
                  Denunciar
                </Button>
              )}
              {esCliente && (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                  disabled={consulta.isPending}
                  onClick={() => consulta.mutate()}
                >
                  <MessageSquare className="h-4 w-4" />
                  Consultar
                </Button>
              )}
              {esCliente && (
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => navigate(`${paths.cliente.pedir}?idTecnico=${idTecnico}`)}
                >
                  <UserCheck className="h-4 w-4" />
                  Solicitar directamente
                </Button>
              )}
              <Button className="flex-1 sm:flex-none" onClick={() => navigate(paths.cliente.pedir)}>
                Pedir servicio
              </Button>
            </>
          )}
        </div>
      </div>

      {idServicioCtx && (
        <DenunciarModal
          open={denunciarOpen}
          onClose={() => setDenunciarOpen(false)}
          idServicio={idServicioCtx}
          idReportado={idTecnico ?? ""}
          nombreReportado={nombre}
        />
      )}

      {viewingCert && (
        <CertViewerModal
          src={viewingCert.src}
          title={viewingCert.title}
          onClose={() => setViewingCert(null)}
        />
      )}
    </div>
  )
}

function CertViewerModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const isPdf = /\.pdf$/i.test(src)
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <FileText className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <div className="flex items-center gap-1.5">
          <a
            href={toViewableUrl(src)}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Descargar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            aria-label="Cerrar visor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {isPdf ? (
        <div className="min-h-0 w-full flex-1">
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`}
            className="h-full w-full border-0 bg-white"
            title={title}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/20 p-4">
          <img src={src} alt={title} className="max-h-full max-w-full rounded-lg object-contain shadow-md" />
        </div>
      )}
    </div>
  )
}
