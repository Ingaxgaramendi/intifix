import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Star,
  BadgeCheck,
  Map as MapIcon,
  List,
  AlertCircle,
  Search,
  Loader2,
  MapPin,
  X,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TechniciansMap, type MapTecnico } from "@/components/map/technicians-map"
import { AddressSearch } from "@/components/map/address-search"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { haversineKm, formatKm } from "@/lib/geo"
import { paths } from "@/routes/paths"
import { useAuthStore } from "@/stores/auth-store"
import { useSpecialties, useUbicacion } from "@/features/services/use-services"
import { useClienteProfile } from "@/features/profile/use-cliente-profile"
import {
  tecnicoCoords,
  tecnicoEspecialidades,
  tecnicoNombre,
  tecnicoTarifa,
  type Tecnico,
} from "@/types/technician"
import { useBuscarTecnicos, useReputaciones, useUbicaciones, type TecnicoFilters } from "./use-buscar-tecnicos"

// ─── Avatar ──────────────────────────────────────────────────────────────────

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

// ─── TecnicoCard ─────────────────────────────────────────────────────────────

function TecnicoCard({
  t,
  active,
  selected,
  rating,
  resenas,
  distanciaKm,
  onHover,
  onSelect,
  onVerPerfil,
}: {
  t: Tecnico
  active: boolean
  selected: boolean
  rating?: number
  resenas?: number
  distanciaKm?: number
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onVerPerfil: () => void
}) {
  const especialidades = tecnicoEspecialidades(t)
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => onHover(t.idUsuario)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(t.idUsuario)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(t.idUsuario)}
      className={cn(
        "flex gap-4 rounded-2xl border bg-card p-4 transition-all cursor-pointer select-none",
        selected
          ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
          : active
            ? "border-primary/50 shadow-sm"
            : "border-border hover:shadow-sm hover:border-primary/30",
      )}
    >
      <Avatar t={t} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold">{tecnicoNombre(t)}</p>
          {t.estadoAprobacion === "APROBADO" && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
          )}
          {selected && (
            <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              en mapa
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {rating != null ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {rating.toFixed(1)}
              {resenas != null && resenas > 0 && (
                <span className="text-muted-foreground">({resenas})</span>
              )}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Sin reseñas</span>
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

          {distanciaKm != null && (
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              selected ? "text-blue-600" : "text-muted-foreground"
            )}>
              <MapPin className="h-3 w-3" />a {formatKm(distanciaKm)}
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
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onVerPerfil() }}
          >
            Ver perfil
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── ZonaBusqueda ─────────────────────────────────────────────────────────────
// Always-visible zone selector: address search + GPS button.
// The AddressSearch stays mounted after selection so the text persists.

function ZonaBusqueda({
  activeLabel,
  onSetLocation,
}: {
  activeLabel: string | null
  onSetLocation: (lat: number, lng: number, label: string) => void
}) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Tu navegador no soporta geolocalización")
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false)
        onSetLocation(pos.coords.latitude, pos.coords.longitude, "Mi ubicación GPS")
      },
      (err) => {
        setGpsLoading(false)
        setGpsError(err.code === 1 ? "Permiso denegado · actívalo en la barra de tu navegador" : "Ubicación no disponible")
      },
      { timeout: 3000, maximumAge: 60_000 },
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <AddressSearch
            placeholder="Buscar zona, distrito o dirección…"
            onSelect={(r) => {
              setGpsError(null)
              const label = r.distrito ?? r.direccion
              onSetLocation(r.lat, r.lng, label)
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGPS}
          disabled={gpsLoading}
          title="Usar mi ubicación GPS actual"
          className="h-11 w-11 shrink-0"
        >
          {gpsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>
      {gpsError && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {gpsError}
        </p>
      )}
      {!gpsError && activeLabel && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-primary" />
          Ordenando desde <span className="font-medium text-foreground">{activeLabel}</span>
        </p>
      )}
      {!gpsError && !activeLabel && !gpsLoading && (
        <p className="text-xs text-muted-foreground">
          Escribe tu zona o pulsa <Navigation className="inline h-3 w-3" /> para usar GPS · así ordenamos los técnicos por cercanía
        </p>
      )}
    </div>
  )
}

// ─── constants ───────────────────────────────────────────────────────────────

const RADIO_OPTIONS = [
  { label: "Sin límite", value: 0 },
  { label: "1 km", value: 1 },
  { label: "3 km", value: 3 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
]

const DEFAULT_FILTERS: TecnicoFilters = { disponibilidad: "DISPONIBLE" }

// ─── page ────────────────────────────────────────────────────────────────────

export function BuscarTecnicosPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const specialties = useSpecialties()

  // Filters & UI
  const [filters, setFilters] = useState<TecnicoFilters>(DEFAULT_FILTERS)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showMapMobile, setShowMapMobile] = useState(false)
  const [orden, setOrden] = useState<"cercania" | "rating" | "precio_asc" | "precio_desc">("cercania")
  const [minRating, setMinRating] = useState(0)
  const [query, setQuery] = useState("")
  const [radioKm, setRadioKm] = useState(0)
  const [filtroDistrito, setFiltroDistrito] = useState("")

  // ── Location: manual (GPS / address) overrides profile ───────────────────
  const [manualLocation, setManualLocation] = useState<{
    lat: number
    lng: number
    label: string
  } | null>(null)

  const cliente = useClienteProfile(user?.idUsuario)
  const ubicCliente = useUbicacion(cliente.data?.idUbicacion)
  const profileCoords =
    ubicCliente.data?.latitud != null && ubicCliente.data?.longitud != null
      ? { lat: Number(ubicCliente.data.latitud), lng: Number(ubicCliente.data.longitud) }
      : null
  const profileLabel = ubicCliente.data?.distrito ?? ubicCliente.data?.direccionTexto ?? null

  // Initialize from profile on first load (if user hasn't set a manual location)
  useEffect(() => {
    if (!manualLocation && profileCoords) {
      setManualLocation({ ...profileCoords, label: profileLabel ?? "tu perfil" })
    }
    // Only run when profile coords first become available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileCoords?.lat, profileCoords?.lng])

  const clienteCoords: { lat: number; lng: number } | null = manualLocation ?? profileCoords
  const coordLabel: string | null = manualLocation?.label ?? profileLabel

  // ── Technician data ───────────────────────────────────────────────────────
  const { data: tecnicos = [], isLoading, isError, refetch } = useBuscarTecnicos(filters)
  const ids = useMemo(() => tecnicos.map((t) => t.idUsuario), [tecnicos])
  const reputaciones = useReputaciones(ids)

  // Batch-fetch ubicaciones so the map gets lat/lng (list endpoint only has idUbicacion)
  const ubicacionIds = useMemo(
    () => tecnicos.map((t) => t.idUbicacion as string | undefined),
    [tecnicos],
  )
  const coordsMap = useUbicaciones(ubicacionIds)

  /** Returns lat/lng for a technician: tries direct fields first, then fetched ubicacion. */
  const getCoordsOf = (t: Tecnico): { lat: number; lng: number } | null => {
    const direct = tecnicoCoords(t)
    if (direct) return direct
    if (t.idUbicacion) return coordsMap.get(t.idUbicacion as string) ?? null
    return null
  }

  const distanciaDe = (t: Tecnico): number | undefined => {
    if (!clienteCoords) return undefined
    const c = getCoordsOf(t)
    return c ? haversineKm(clienteCoords, c) : undefined
  }

  // Unique districts extracted from loaded technicians
  const distritos = useMemo(() => {
    const set = new Set<string>()
    tecnicos.forEach((t) => {
      const d = t.ubicacion?.distrito
      if (d) set.add(d)
    })
    return [...set].sort()
  }, [tecnicos])

  const hasFiltrosExtra =
    !!filters.idEspecialidad ||
    filters.disponibilidad !== "DISPONIBLE" ||
    minRating > 0 ||
    query.trim() !== "" ||
    radioKm > 0 ||
    filtroDistrito !== ""

  const limpiar = () => {
    setFilters(DEFAULT_FILTERS)
    setMinRating(0)
    setQuery("")
    setOrden("cercania")
    setRadioKm(0)
    setFiltroDistrito("")
    setSelectedId(null)
  }

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase()
    const arr = tecnicos.filter((t) => {
      if (q && !tecnicoNombre(t).toLowerCase().includes(q)) return false
      if (
        filters.disponibilidad &&
        t.disponibilidad &&
        t.disponibilidad !== filters.disponibilidad
      )
        return false
      if (minRating > 0 && (reputaciones.get(t.idUsuario)?.rating ?? 0) < minRating) return false
      if (radioKm > 0) {
        const d = distanciaDe(t)
        if (d == null || d > radioKm) return false
      }
      if (filtroDistrito) {
        const dist = t.ubicacion?.distrito ?? ""
        if (!dist.toLowerCase().includes(filtroDistrito.toLowerCase())) return false
      }
      return true
    })
    arr.sort((a, b) => {
      if (orden === "cercania") return (distanciaDe(a) ?? Infinity) - (distanciaDe(b) ?? Infinity)
      if (orden === "precio_asc")
        return (tecnicoTarifa(a) ?? Infinity) - (tecnicoTarifa(b) ?? Infinity)
      if (orden === "precio_desc")
        return (tecnicoTarifa(b) ?? -Infinity) - (tecnicoTarifa(a) ?? -Infinity)
      return (reputaciones.get(b.idUsuario)?.rating ?? 0) - (reputaciones.get(a.idUsuario)?.rating ?? 0)
    })
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tecnicos,
    orden,
    minRating,
    query,
    filters.disponibilidad,
    clienteCoords,
    reputaciones,
    radioKm,
    filtroDistrito,
    coordsMap,
  ])

  const mapItems = useMemo<MapTecnico[]>(
    () =>
      visibles.flatMap((t) => {
        const c = getCoordsOf(t)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibles, coordsMap],
  )

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Buscar técnicos</h1>
        <p className="mt-1 text-muted-foreground">Encuentra expertos verificados cerca de ti.</p>
      </header>

      {/* ── Filters card ─────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">

        {/* Zone picker (always visible) */}
        <ZonaBusqueda
          activeLabel={coordLabel}
          onSetLocation={(lat, lng, label) => setManualLocation({ lat, lng, label })}
        />

        <div className="h-px bg-border" />

        {/* Name search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre del técnico…"
            className="h-10 pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          <div className="min-w-32.5 flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Especialidad</label>
            <Select
              value={filters.idEspecialidad ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, idEspecialidad: e.target.value || undefined }))
              }
            >
              <option value="">Todas</option>
              {specialties.data?.map((e) => (
                <option key={e.idEspecialidad} value={e.idEspecialidad}>
                  {e.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="min-w-30 flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Disponibilidad</label>
            <Select
              value={filters.disponibilidad ?? "DISPONIBLE"}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  disponibilidad: e.target.value as TecnicoFilters["disponibilidad"],
                }))
              }
            >
              <option value="DISPONIBLE">Disponibles</option>
              <option value="OCUPADO">Ocupados</option>
            </Select>
          </div>

          <div className="min-w-30 flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Radio</label>
            <Select
              value={radioKm}
              onChange={(e) => setRadioKm(Number(e.target.value))}
              disabled={!clienteCoords}
              title={!clienteCoords ? "Define tu zona para filtrar por radio" : undefined}
            >
              {RADIO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          {distritos.length > 0 && (
            <div className="min-w-32.5 flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Distrito</label>
              <Select
                value={filtroDistrito}
                onChange={(e) => setFiltroDistrito(e.target.value)}
              >
                <option value="">Todos</option>
                {distritos.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="min-w-32.5 flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
            <Select
              value={orden}
              onChange={(e) =>
                setOrden(e.target.value as typeof orden)
              }
            >
              <option value="cercania">Más cercanos</option>
              <option value="rating">Mejor calificados</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
            </Select>
          </div>

          <div className="min-w-30 flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Calificación mín.</label>
            <Select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
            >
              <option value={0}>Cualquiera</option>
              <option value={3}>3★ o más</option>
              <option value={4}>4★ o más</option>
              <option value={4.5}>4.5★ o más</option>
            </Select>
          </div>
        </div>

        {(hasFiltrosExtra) && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={limpiar} className="h-8 gap-1.5 text-xs">
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {/* ── Results + map ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Buscando…"
          ) : (
            <>
              <span className="font-medium text-foreground">{visibles.length}</span> técnico
              {visibles.length === 1 ? "" : "s"}
              {radioKm > 0 && clienteCoords && ` dentro de ${radioKm} km`}
              {filtroDistrito && ` · ${filtroDistrito}`}
            </>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={() => setShowMapMobile((v) => !v)}
        >
          {showMapMobile ? (
            <><List className="h-4 w-4 mr-1.5" /> Lista</>
          ) : (
            <><MapIcon className="h-4 w-4 mr-1.5" /> Mapa</>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* List */}
        <div className={cn("space-y-3", showMapMobile && "hidden lg:block")}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))
          ) : isError ? (
            <EmptyPanel
              icon={<AlertCircle className="h-10 w-10 text-destructive" />}
              title="No pudimos cargar los técnicos"
            >
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Reintentar
              </Button>
            </EmptyPanel>
          ) : visibles.length === 0 ? (
            <EmptyPanel
              icon={
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="h-7 w-7" />
                </span>
              }
              title={
                radioKm > 0 && clienteCoords
                  ? `No se encontraron técnicos en esta zona (${radioKm} km)`
                  : filtroDistrito
                    ? `No se encontraron técnicos en ${filtroDistrito}`
                    : "Sin técnicos disponibles"
              }
              subtitle={
                radioKm > 0 && clienteCoords
                  ? "Prueba ampliando el radio de búsqueda o eliminando filtros."
                  : "Prueba con otra especialidad, disponibilidad o calificación."
              }
            >
              {hasFiltrosExtra && (
                <Button variant="outline" size="sm" className="mt-4" onClick={limpiar}>
                  Limpiar filtros
                </Button>
              )}
            </EmptyPanel>
          ) : (
            visibles.map((t) => {
              const rep = reputaciones.get(t.idUsuario)
              return (
                <TecnicoCard
                  key={t.idUsuario}
                  t={t}
                  active={hoveredId === t.idUsuario}
                  selected={selectedId === t.idUsuario}
                  rating={rep?.rating}
                  resenas={rep?.totalResenas}
                  distanciaKm={distanciaDe(t)}
                  onHover={setHoveredId}
                  onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
                  onVerPerfil={() => navigate(paths.cliente.tecnicoPerfil(t.idUsuario))}
                />
              )
            })
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
              selectedId={selectedId}
              onHover={setHoveredId}
              onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
              clienteCoords={clienteCoords ?? undefined}
              height="100%"
              className="h-[60vh] lg:h-full"
            />
          ) : (
            <MapPlaceholder loading={isLoading} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MapPlaceholder ───────────────────────────────────────────────────────────

function MapPlaceholder({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-center lg:h-full">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <MapPin className="h-7 w-7" />
          </span>
          <div className="px-6">
            <p className="font-medium">Sin ubicación en el mapa</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Los técnicos que aparecen en lista aún no tienen su dirección registrada.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── EmptyPanel ──────────────────────────────────────────────────────────────

function EmptyPanel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
      {icon}
      <p className="mt-4 font-medium">{title}</p>
      {subtitle && <p className="mt-1 px-6 text-sm text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  )
}
