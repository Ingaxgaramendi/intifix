import { Link } from "react-router-dom"
import {
  Briefcase,
  ClipboardList,
  CalendarDays,
  Star,
  MapPin,
  BadgeCheck,
  ArrowRight,
  ThumbsUp,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/shared/star-rating"
import { cn } from "@/lib/utils"
import { useMisAsignaciones } from "@/features/technician/use-technician"
import { useReputacion, usePromedioPuntuacion, usePorcentajeRecomendacion } from "@/features/calificaciones/use-calificaciones"
import { useTecnicoProfile } from "@/features/profile/use-tecnico-profile"
import { reputacionPromedio } from "@/types/calificacion"
import { asignacionEstado } from "@/types/service"
import { paths } from "@/routes/paths"

const ESTADOS_ACTIVOS = ["ASIGNADO", "EN_PROCESO", "EN_PROGRESO", "INICIADO"]

const QUICK_ACTIONS = [
  { to: paths.tecnico.disponibles, icon: Briefcase, title: "Servicios disponibles", desc: "Encuentra trabajos y envía cotizaciones" },
  { to: paths.tecnico.asignaciones, icon: ClipboardList, title: "Mis asignaciones", desc: "Inicia y finaliza tus trabajos" },
  { to: paths.tecnico.agenda, icon: CalendarDays, title: "Mi agenda", desc: "Gestiona horarios y excepciones" },
  { to: paths.tecnico.reputacion, icon: Star, title: "Reputación", desc: "Tus calificaciones y promedios" },
  { to: paths.tecnico.especialidades, icon: BadgeCheck, title: "Especialidades", desc: "Define en qué eres experto" },
  { to: paths.tecnico.perfil, icon: MapPin, title: "Mi perfil y ubicación", desc: "Datos, ubicación, especialidades y documentos" },
]

function StatCard({
  label,
  loading,
  children,
}: {
  label: string
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-20 rounded-lg" />
      ) : (
        <div className="mt-1">{children}</div>
      )}
    </div>
  )
}

export function TecnicoDashboard() {
  const correo = useAuthStore((s) => s.correo)
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const name = correo?.split("@")[0] ?? "técnico"

  const asignaciones = useMisAsignaciones(idTec, 0)
  const reputacion = useReputacion(idTec)
  const promedioReal = usePromedioPuntuacion(idTec)
  const pctQuery = usePorcentajeRecomendacion(idTec)
  const profile = useTecnicoProfile(idTec)

  const activas = (asignaciones.data?.content ?? []).filter((a) =>
    ESTADOS_ACTIVOS.includes(asignacionEstado(a).toUpperCase()),
  ).length
  const promedio = promedioReal.data ?? reputacionPromedio(reputacion.data)
  const pctRecomendacion = pctQuery.data ?? reputacion.data?.porcentajeRecomendacion

  const estadoAprobacion = profile.data?.estadoAprobacion
  const aprobado = estadoAprobacion === "APROBADO"
  const disponible = profile.data?.disponibilidad === "DISPONIBLE"

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl min-h-[260px] flex items-end">
        <img
          src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/55 to-slate-900/60" />
        <div className="relative z-10 flex w-full flex-wrap items-end justify-between gap-4 p-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Panel técnico</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Hola, {name} 👋</h1>
            <p className="mt-2 max-w-sm text-white/75">Gestiona tus trabajos, agenda y reputación.</p>
          </div>
          <Link
            to={paths.tecnico.disponibles}
            className="group inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl dark:bg-primary dark:text-primary-foreground dark:shadow-primary/20 dark:hover:bg-primary/90"
          >
            <Briefcase className="h-4 w-4" />
            Ver disponibles
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Approval / availability banner */}
      {!profile.isLoading && estadoAprobacion && (
        <Link
          to={paths.tecnico.perfil}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
            aprobado
              ? "border-success/30 bg-success/5"
              : "border-warning/40 bg-warning/5",
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              aprobado ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
            )}
          >
            {aprobado ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {aprobado ? "Cuenta verificada" : `Cuenta ${estadoAprobacion.toLowerCase()}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {aprobado
                ? disponible
                  ? "Estás disponible y apareces en las búsquedas."
                  : "Estás marcado como ocupado. Actívate para recibir solicitudes."
                : "Completa y verifica tu perfil para empezar a recibir trabajos."}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* Live stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Asignaciones activas" loading={asignaciones.isLoading}>
          <p className="text-2xl font-bold">{activas}</p>
        </StatCard>
        <StatCard label="Calificación promedio" loading={reputacion.isLoading}>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{promedio != null ? promedio.toFixed(1) : "—"}</span>
            {promedio != null && <StarRating value={promedio} size={16} />}
          </div>
        </StatCard>
        <StatCard label="% recomendación" loading={pctQuery.isLoading}>
          <p className="flex items-center gap-2 text-2xl font-bold">
            {pctRecomendacion != null ? (
              <>
                <ThumbsUp className="h-5 w-5 text-success" />
                {Number(pctRecomendacion).toFixed(2)}%
              </>
            ) : (
              "—"
            )}
          </p>
        </StatCard>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg dark:hover:border-primary/60 dark:hover:shadow-xl"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
