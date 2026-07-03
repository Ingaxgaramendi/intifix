import { Star, ThumbsUp, MessageSquareText, AlertCircle } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/shared/star-rating"
import { formatDate } from "@/lib/format"
import { PerfilLink } from "@/components/shared/perfil-link"
import { paths } from "@/routes/paths"
import { useClienteNombre } from "@/features/services/use-services"
import { reputacionPromedio, reputacionTotalResenas, type Calificacion } from "@/types/calificacion"
import {
  useCalificacionesTecnico,
  usePromediosCategoria,
  usePromedioPuntuacion,
  useReputacion,
  useTotalCalificaciones,
  type PromediosCategoria,
} from "./use-calificaciones"

const CATEGORIAS: { key: keyof PromediosCategoria; label: string }[] = [
  { key: "puntualidad", label: "Puntualidad" },
  { key: "profesionalismo", label: "Profesionalismo" },
  { key: "calidadTrabajo", label: "Calidad del trabajo" },
  { key: "comunicacion", label: "Comunicación" },
]

function CategoriaRow({ label, value }: { label: string; value?: number }) {
  const pct = value != null ? Math.max(0, Math.min(100, (value / 5) * 100)) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value != null ? value.toFixed(1) : "—"}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Star
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      {value && <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>}
      {children}
    </div>
  )
}

function ReviewCard({ c }: { c: Calificacion }) {
  const { data: nombreResuelto } = useClienteNombre(c.nombreCliente ? undefined : c.idCliente)
  const nombre = c.nombreCliente ?? nombreResuelto ?? "Cliente"
  const perfilTo = c.idCliente ? paths.tecnico.clientePerfil(c.idCliente) : undefined
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {nombre.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <PerfilLink to={perfilTo} state={{ idServicio: c.idServicio }} className="font-medium">
              {nombre}
            </PerfilLink>
            <p className="text-xs text-muted-foreground">{formatDate(c.fechaCalificacion ?? c.fechaCreacion)}</p>
          </div>
        </div>
        <StarRating value={c.puntuacion} size={16} />
      </div>
      {c.comentario && <p className="mt-3 text-sm text-muted-foreground">“{c.comentario}”</p>}
      {c.recomendaria != null && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-success">
          {c.recomendaria && <ThumbsUp className="h-3.5 w-3.5" />}
          {c.recomendaria ? "Recomendaría al técnico" : "No recomendaría"}
        </p>
      )}
    </div>
  )
}

export function ReputacionPage() {
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const reputacion = useReputacion(idTec)
  const categorias = usePromediosCategoria(idTec)
  const reviews = useCalificacionesTecnico(idTec, 0)
  // Fuentes reales (AVG/COUNT en BD): la reputación cacheada queda en 0.
  const promedioReal = usePromedioPuntuacion(idTec)
  const totalReal = useTotalCalificaciones(idTec)

  const promedio = promedioReal.data ?? reputacionPromedio(reputacion.data)
  const total = totalReal.data ?? reputacionTotalResenas(reputacion.data) ?? reviews.data?.length
  const items = reviews.data ?? []
  const pctRecomendacion =
    reputacion.data?.porcentajeRecomendacion ??
    (items.length
      ? Math.round((items.filter((c) => c.recomendaria).length / items.length) * 100)
      : undefined)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mi reputación</h1>
        <p className="mt-1 text-muted-foreground">Lo que opinan tus clientes de tu trabajo.</p>
      </header>

      {reputacion.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Star} label="Calificación promedio">
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl font-bold tracking-tight">
                {promedio != null ? promedio.toFixed(1) : "—"}
              </span>
              {promedio != null && <StarRating value={promedio} size={16} />}
            </div>
          </StatCard>
          <StatCard icon={MessageSquareText} label="Total de reseñas" value={total != null ? String(total) : "—"} />
          <StatCard
            icon={ThumbsUp}
            label="Recomendación"
            value={pctRecomendacion != null ? `${pctRecomendacion}%` : "—"}
          />
        </div>
      )}

      {/* Per-category breakdown */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Desglose por categoría</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Promedio de tus calificaciones en cada aspecto (sobre 5).
        </p>
        {categorias.isLoading ? (
          <div className="mt-5 space-y-4">
            {CATEGORIAS.map((c) => (
              <Skeleton key={c.key} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {CATEGORIAS.map((c) => (
              <CategoriaRow key={c.key} label={c.label} value={categorias.data?.[c.key]} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Reseñas</h2>
        {reviews.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : reviews.isError ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="mt-4 font-medium">No pudimos cargar tus reseñas</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Star className="h-7 w-7" />
            </span>
            <p className="mt-4 font-medium">Aún no tienes reseñas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Completa servicios para empezar a construir tu reputación.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c, i) => (
              <ReviewCard key={c.idCalificacion ?? i} c={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
