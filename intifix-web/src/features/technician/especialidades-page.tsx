import { BadgeCheck, Check, Loader2, Plus, Wrench, X } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  useAsignarEspecialidad,
  useEspecialidadesCatalogo,
  useMisEspecialidades,
  useRemoverEspecialidad,
} from "@/features/profile/use-tecnico-profile"

export function EspecialidadesPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario) ?? ""
  const catalogo = useEspecialidadesCatalogo()
  const mias = useMisEspecialidades(idUsuario)
  const asignar = useAsignarEspecialidad(idUsuario)
  const remover = useRemoverEspecialidad(idUsuario)

  const asignadasIds = new Set((mias.data ?? []).map((e) => e.idEspecialidad))
  const busy = asignar.isPending || remover.isPending

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BadgeCheck className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis especialidades</h1>
          <p className="mt-1 text-muted-foreground">
            Marca las áreas en las que trabajas. Aparecen en tu perfil y en las búsquedas de clientes.
          </p>
        </div>
      </header>

      {/* Assigned summary */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <Wrench className="h-5 w-5 text-primary" />
          Tus especialidades
        </h2>
        <div className="mt-4">
          {mias.isLoading ? (
            <Skeleton className="h-9 w-full rounded-lg" />
          ) : asignadasIds.size ? (
            <div className="flex flex-wrap gap-2">
              {(mias.data ?? []).map((e) => (
                <span
                  key={e.idEspecialidad}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1.5 pl-3 pr-1.5 text-sm font-medium text-primary"
                >
                  {e.nombre}
                  <button
                    type="button"
                    aria-label={`Quitar ${e.nombre}`}
                    disabled={busy}
                    onClick={() => remover.mutate(e.idEspecialidad)}
                    className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-primary/20 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no has añadido especialidades.</p>
          )}
        </div>
      </section>

      {/* Catalog: tap to toggle */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Catálogo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Toca una especialidad para añadirla o quitarla.</p>

        <div className="mt-5">
          {catalogo.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : catalogo.data?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {catalogo.data.map((e) => {
                const activa = asignadasIds.has(e.idEspecialidad)
                return (
                  <button
                    key={e.idEspecialidad}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      activa
                        ? remover.mutate(e.idEspecialidad)
                        : asignar.mutate(e.idEspecialidad)
                    }
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm disabled:opacity-60",
                      activa
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:border-primary/30",
                    )}
                  >
                    <div>
                      <p className="font-medium">{e.nombre}</p>
                      {e.descripcion && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{e.descripcion}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                        activa ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : activa ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay especialidades en el catálogo.</p>
          )}
        </div>
      </section>
    </div>
  )
}
