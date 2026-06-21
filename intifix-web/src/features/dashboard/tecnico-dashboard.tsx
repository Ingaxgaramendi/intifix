import { Link } from "react-router-dom"
import { Briefcase, ClipboardList, CalendarDays, Star, MapPin, BadgeCheck, ArrowRight } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { paths } from "@/routes/paths"

const QUICK_ACTIONS = [
  { to: paths.tecnico.disponibles, icon: Briefcase, title: "Servicios disponibles", desc: "Encuentra trabajos y envía cotizaciones" },
  { to: paths.tecnico.asignaciones, icon: ClipboardList, title: "Mis asignaciones", desc: "Inicia y finaliza tus trabajos" },
  { to: paths.tecnico.agenda, icon: CalendarDays, title: "Mi agenda", desc: "Gestiona horarios y excepciones" },
  { to: paths.tecnico.reputacion, icon: Star, title: "Reputación", desc: "Tus calificaciones y promedios" },
  { to: paths.tecnico.especialidades, icon: BadgeCheck, title: "Especialidades", desc: "Define en qué eres experto" },
  { to: paths.tecnico.ubicacion, icon: MapPin, title: "Mi ubicación", desc: "Ajusta tu punto en el mapa" },
]

export function TecnicoDashboard() {
  const correo = useAuthStore((s) => s.correo)
  const name = correo?.split("@")[0] ?? "técnico"

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hola, {name} 👋</h1>
          <p className="mt-1 text-muted-foreground">Gestiona tus trabajos y reputación.</p>
        </div>
        <Link
          to={paths.tecnico.perfil}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Ver mi perfil
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Asignaciones activas", value: "—" },
          { label: "Calificación promedio", value: "—" },
          { label: "% recomendación", value: "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
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
