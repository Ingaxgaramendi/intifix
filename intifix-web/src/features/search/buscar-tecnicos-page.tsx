import { useMemo, useState } from "react"
import { Star, BadgeCheck, Map as MapIcon, List, AlertCircle, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { TechniciansMap, type MapTecnico } from "@/components/map/technicians-map"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { useSpecialties } from "@/features/services/use-services"
import {
  tecnicoCalificacion,
  tecnicoCoords,
  tecnicoEspecialidades,
  tecnicoNombre,
  tecnicoTarifa,
  type Tecnico,
} from "@/types/technician"
import {
  useBuscarTecnicos,
  useTecnicoDetalle,
  type TecnicoFilters,
} from "./use-buscar-tecnicos"

function Avatar({ t, size = 48 }: { t: Tecnico; size?: number }) {
  const nombre = tecnicoNombre(t)
  if (t.fotoPerfilUrl) {
    return (
      <img
        src={t.fotoPerfilUrl}
        alt={nombre}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
    >
      {nombre.slice(0, 2).toUpperCase()}
    </span>
  )
}

function Rating({ value }: { value?: number }) {
  if (value == null) return <span className="text-sm text-muted-foreground">Sin reseñas</span>
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium">
      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
      {value.toFixed(1)}
    </span>
  )
}

function TecnicoCard({
  t,
  active,
  onHover,
  onVerPerfil,
}: {
  t: Tecnico
  active: boolean
  onHover: (id: string | null) => void
  onVerPerfil: () => void
}) {
  const especialidades = tecnicoEspecialidades(t)
  return (
    <div
      onMouseEnter={() => onHover(t.idUsuario)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "flex gap-4 rounded-2xl border bg-card p-4 transition-all",
        active ? "border-primary shadow-md ring-1 ring-primary/30" : "border-border hover:shadow-sm",
      )}
    >
      <Avatar t={t} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold">{tecnicoNombre(t)}</p>
          {t.estadoAprobacion === "APROBADO" && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3">
          <Rating value={tecnicoCalificacion(t)} />
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
        </div>
        {especialidades.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {especialidades.slice(0, 3).map((e) => (
              <span key={e} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {e}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm">
            <span className="font-semibold">{formatCurrency(tecnicoTarifa(t))}</span>
            <span className="text-muted-foreground"> /base</span>
          </span>
          <Button size="sm" variant="outline" onClick={onVerPerfil}>
            Ver perfil
          </Button>
        </div>
      </div>
    </div>
  )
}

function PerfilModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: t, isLoading } = useTecnicoDetalle(id)
  return (
    <Modal open={!!id} onClose={onClose} title="Perfil del técnico">
      {isLoading || !t ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar t={t} size={64} />
            <div>
              <p className="text-lg font-semibold">{tecnicoNombre(t)}</p>
              <Rating value={tecnicoCalificacion(t)} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Tarifa base</dt>
              <dd className="font-medium">{formatCurrency(tecnicoTarifa(t))}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Experiencia</dt>
              <dd className="font-medium">
                {t.experienciaAnios != null ? `${t.experienciaAnios} años` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Servicios</dt>
              <dd className="font-medium">{t.totalServicios ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Disponibilidad</dt>
              <dd className="font-medium">{t.disponibilidad ?? "—"}</dd>
            </div>
          </dl>
          {tecnicoEspecialidades(t).length > 0 && (
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Especialidades</p>
              <div className="flex flex-wrap gap-1.5">
                {tecnicoEspecialidades(t).map((e) => (
                  <span key={e} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export function BuscarTecnicosPage() {
  const specialties = useSpecialties()
  const [filters, setFilters] = useState<TecnicoFilters>({ disponibilidad: "DISPONIBLE" })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const [showMapMobile, setShowMapMobile] = useState(false)

  const { data: tecnicos = [], isLoading, isError, refetch } = useBuscarTecnicos(filters)

  const mapItems = useMemo<MapTecnico[]>(
    () =>
      tecnicos.flatMap((t) => {
        const c = tecnicoCoords(t)
        if (!c) return []
        return [
          {
            id: t.idUsuario,
            lat: c.lat,
            lng: c.lng,
            nombre: tecnicoNombre(t),
            subtitulo: tecnicoEspecialidades(t)[0],
            precio: formatCurrency(tecnicoTarifa(t)),
          },
        ]
      }),
    [tecnicos],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Buscar técnicos</h1>
        <p className="mt-1 text-muted-foreground">Encuentra expertos verificados cerca de ti.</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium" htmlFor="filtro-especialidad">
            Especialidad
          </label>
          <Select
            id="filtro-especialidad"
            value={filters.idEspecialidad ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, idEspecialidad: e.target.value || undefined }))
            }
          >
            <option value="">Todas las especialidades</option>
            {specialties.data?.map((e) => (
              <option key={e.idEspecialidad} value={e.idEspecialidad}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium" htmlFor="filtro-disponibilidad">
            Disponibilidad
          </label>
          <Select
            id="filtro-disponibilidad"
            value={filters.disponibilidad ?? "DISPONIBLE"}
            disabled={!!filters.idEspecialidad}
            onChange={(e) =>
              setFilters((f) => ({ ...f, disponibilidad: e.target.value as TecnicoFilters["disponibilidad"] }))
            }
          >
            <option value="DISPONIBLE">Disponibles</option>
            <option value="OCUPADO">Ocupados</option>
          </Select>
        </div>
        <Button variant="outline" className="sm:hidden" onClick={() => setShowMapMobile((v) => !v)}>
          {showMapMobile ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          {showMapMobile ? "Ver lista" : "Ver mapa"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* List */}
        <div className={cn("space-y-3", showMapMobile && "hidden lg:block")}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : isError ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="mt-4 font-medium">No pudimos cargar los técnicos</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search className="h-7 w-7" />
              </span>
              <p className="mt-4 font-medium">Sin resultados</p>
              <p className="mt-1 text-sm text-muted-foreground">Prueba con otra especialidad o disponibilidad.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{tecnicos.length} técnicos encontrados</p>
              {tecnicos.map((t) => (
                <TecnicoCard
                  key={t.idUsuario}
                  t={t}
                  active={hoveredId === t.idUsuario}
                  onHover={setHoveredId}
                  onVerPerfil={() => setPerfilId(t.idUsuario)}
                />
              ))}
            </>
          )}
        </div>

        {/* Map */}
        <div
          className={cn(
            "lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]",
            showMapMobile ? "block" : "hidden lg:block",
          )}
        >
          {mapItems.length > 0 ? (
            <TechniciansMap
              items={mapItems}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              height="100%"
              className="h-[60vh] lg:h-full"
            />
          ) : (
            <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground lg:h-full">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <span className="px-6">Los técnicos de esta búsqueda no tienen ubicación en el mapa.</span>
              )}
            </div>
          )}
        </div>
      </div>

      <PerfilModal id={perfilId} onClose={() => setPerfilId(null)} />
    </div>
  )
}
