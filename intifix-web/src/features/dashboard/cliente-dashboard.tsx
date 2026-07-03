import { Link } from "react-router-dom"
import {
  Search,
  ClipboardList,
  CreditCard,
  MessageSquare,
  ArrowRight,
  PlusCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { useMisServicios } from "@/features/services/use-services"
import { paths } from "@/routes/paths"

const ESTADOS_ACTIVOS = ["PENDIENTE", "COTIZANDO", "ASIGNADO", "EN_PROCESO"]

const QUICK_ACTIONS = [
  { to: paths.cliente.pedir, icon: PlusCircle, title: "Pedir un servicio", desc: "Describe tu problema y recibe cotizaciones" },
  { to: paths.cliente.buscarTecnicos, icon: Search, title: "Buscar técnicos", desc: "Explora por especialidad y cercanía" },
  { to: paths.cliente.servicios, icon: ClipboardList, title: "Mis servicios", desc: "Sigue el estado de tus solicitudes" },
  { to: paths.cliente.pagos, icon: CreditCard, title: "Pagos", desc: "Revisa tus facturas y métodos" },
]

function StatCard({
  to,
  icon: Icon,
  label,
  value,
  loading,
}: {
  to: string
  icon: typeof ClipboardList
  label: string
  value: number
  loading: boolean
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12 rounded-lg" />
      ) : (
        <p className="mt-1 text-2xl font-bold">{value}</p>
      )}
    </Link>
  )
}

export function ClienteDashboard() {
  const correo = useAuthStore((s) => s.correo)
  const idCliente = useAuthStore((s) => s.user?.idUsuario)
  const name = correo?.split("@")[0] ?? "cliente"

  const servicios = useMisServicios(idCliente, 0)
  const content = servicios.data?.content ?? []
  const activos = content.filter((s) => ESTADOS_ACTIVOS.includes(String(s.estado).toUpperCase())).length
  const finalizados = content.filter((s) => String(s.estado).toUpperCase() === "FINALIZADO").length
  const total = servicios.data?.totalElements ?? content.length

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl min-h-[260px] flex items-end">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/50 to-primary/40" />
        <div className="relative z-10 flex w-full flex-wrap items-end justify-between gap-4 p-8">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Bienvenido de vuelta</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Hola, {name} 👋</h1>
            <p className="mt-2 max-w-sm text-white/75">Técnicos verificados te envían cotizaciones en minutos.</p>
          </div>
          <Link
            to={paths.cliente.pedir}
            className="group inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl dark:bg-primary dark:text-primary-foreground dark:shadow-primary/20 dark:hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Pedir servicio
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Live summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          to={paths.cliente.servicios}
          icon={Loader2}
          label="Servicios activos"
          value={activos}
          loading={servicios.isLoading}
        />
        <StatCard
          to={paths.cliente.servicios}
          icon={CheckCircle2}
          label="Finalizados"
          value={finalizados}
          loading={servicios.isLoading}
        />
        <StatCard
          to={paths.cliente.servicios}
          icon={ClipboardList}
          label="Total de solicitudes"
          value={total}
          loading={servicios.isLoading}
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
