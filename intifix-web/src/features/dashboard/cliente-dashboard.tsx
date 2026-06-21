import { Link } from "react-router-dom"
import { Search, ClipboardList, CreditCard, MessageSquare, ArrowRight, PlusCircle } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { paths } from "@/routes/paths"

const QUICK_ACTIONS = [
  { to: paths.cliente.pedir, icon: PlusCircle, title: "Pedir un servicio", desc: "Describe tu problema y recibe cotizaciones" },
  { to: paths.cliente.buscarTecnicos, icon: Search, title: "Buscar técnicos", desc: "Explora por especialidad y cercanía" },
  { to: paths.cliente.servicios, icon: ClipboardList, title: "Mis servicios", desc: "Sigue el estado de tus solicitudes" },
  { to: paths.cliente.pagos, icon: CreditCard, title: "Pagos", desc: "Revisa tus facturas y métodos" },
]

export function ClienteDashboard() {
  const correo = useAuthStore((s) => s.correo)
  const name = correo?.split("@")[0] ?? "cliente"

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Hola, {name} 👋</h1>
        <p className="mt-1 text-muted-foreground">¿Qué necesitas reparar hoy?</p>
      </header>

      {/* Prominent request CTA */}
      <Link
        to={paths.cliente.pedir}
        className="group flex items-center justify-between rounded-3xl bg-primary p-7 text-primary-foreground shadow-sm transition-shadow hover:shadow-lg"
      >
        <div>
          <h2 className="text-xl font-semibold">Pedir un servicio</h2>
          <p className="mt-1 text-primary-foreground/80">
            Técnicos verificados te envían cotizaciones en minutos.
          </p>
        </div>
        <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
      </Link>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Link
        to={paths.shared.chat}
        className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="text-sm">Habla con tus técnicos desde el chat en tiempo real</span>
        <ArrowRight className="ml-auto h-4 w-4" />
      </Link>
    </div>
  )
}
