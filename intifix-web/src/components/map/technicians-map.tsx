import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"

export interface MapTecnico {
  id: string
  lat: number
  lng: number
  nombre: string
  subtitulo?: string
  precio?: string
}

const DEFAULT_CENTER: [number, number] = [-12.0464, -77.0428] // Lima

function pin(highlighted: boolean) {
  const size = highlighted ? 32 : 22
  const bg = highlighted ? "#D70466" : "#FF385C"
  return L.divIcon({
    className: "intifix-tec-marker",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${bg};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);transition:all .15s"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Refits the viewport whenever the set of markers changes. */
function FitBounds({ points }: { points: MapTecnico[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14)
      return
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
  }, [points, map])
  return null
}

/**
 * Airbnb-style results map. Coral markers; the hovered card's marker grows and
 * darkens. Hovering a marker reports back via onHover for two-way sync.
 */
export function TechniciansMap({
  items,
  hoveredId,
  onHover,
  className,
  height = 480,
}: {
  items: MapTecnico[]
  hoveredId?: string | null
  onHover?: (id: string | null) => void
  className?: string
  height?: number | string
}) {
  const center = useMemo<[number, number]>(
    () => (items[0] ? [items[0].lat, items[0].lng] : DEFAULT_CENTER),
    [items],
  )

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full overflow-hidden rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={items} />
        {items.map((t) => (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={pin(hoveredId === t.id)}
            eventHandlers={{
              mouseover: () => onHover?.(t.id),
              mouseout: () => onHover?.(null),
            }}
          >
            <Popup>
              <div className="space-y-0.5">
                <p className="font-semibold">{t.nombre}</p>
                {t.subtitulo && <p className="text-xs text-muted-foreground">{t.subtitulo}</p>}
                {t.precio && <p className="text-xs font-medium">{t.precio}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
