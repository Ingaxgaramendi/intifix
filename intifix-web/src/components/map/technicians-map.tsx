import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from "react-leaflet"
import { cn } from "@/lib/utils"
import { haversineKm, formatKm } from "@/lib/geo"

export interface MapTecnico {
  id: string
  lat: number
  lng: number
  nombre: string
  subtitulo?: string
  precio?: string
}

const DEFAULT_CENTER: [number, number] = [-12.0464, -77.0428] // Lima

function tecnicoPin(highlighted: boolean, selected: boolean) {
  const size = selected ? 36 : highlighted ? 30 : 22
  const bg = selected ? "#7a1f3d" : highlighted ? "#D70466" : "#FF385C"
  const ring = selected
    ? `box-shadow:0 0 0 5px rgba(122,31,61,0.25),0 4px 14px rgba(0,0,0,.4);`
    : `box-shadow:0 2px 8px rgba(0,0,0,.35);`
  return L.divIcon({
    className: "intifix-tec-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${bg};border:3px solid white;
      ${ring}
      transition:all .2s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const clientePin = L.divIcon({
  className: "intifix-client-marker",
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        position:absolute;inset:-10px;
        border-radius:9999px;
        background:rgba(37,99,235,0.18);
        animation:pulso 2s ease-in-out infinite;
      "></div>
      <div style="
        width:20px;height:20px;border-radius:9999px;
        background:#2563eb;border:3px solid white;
        box-shadow:0 2px 10px rgba(37,99,235,.55);
        position:relative;z-index:1;
      "></div>
    </div>
    <style>
      @keyframes pulso {
        0%,100%{transform:scale(1);opacity:.6}
        50%{transform:scale(1.4);opacity:.25}
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

/** Ajusta el viewport cuando cambia el conjunto de marcadores. */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => `${p.id}`).join(",")])
  return null
}

/** Vuela suavemente al marcador del técnico seleccionado. */
function FlyToSelected({
  items,
  selectedId,
  clienteCoords,
}: {
  items: MapTecnico[]
  selectedId: string | null | undefined
  clienteCoords?: { lat: number; lng: number } | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    const item = items.find((i) => i.id === selectedId)
    if (!item) return

    if (clienteCoords) {
      // Fit both client and selected technician in view
      const bounds = L.latLngBounds(
        [clienteCoords.lat, clienteCoords.lng],
        [item.lat, item.lng],
      )
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true, duration: 0.9 })
    } else {
      map.flyTo([item.lat, item.lng], Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 0.8,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])
  return null
}

export function TechniciansMap({
  items,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  clienteCoords,
  className,
  height = 480,
}: {
  items: MapTecnico[]
  hoveredId?: string | null
  selectedId?: string | null
  onHover?: (id: string | null) => void
  onSelect?: (id: string | null) => void
  clienteCoords?: { lat: number; lng: number } | null
  className?: string
  height?: number | string
}) {
  const center = useMemo<[number, number]>(
    () =>
      clienteCoords
        ? [clienteCoords.lat, clienteCoords.lng]
        : items[0]
          ? [items[0].lat, items[0].lng]
          : DEFAULT_CENTER,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) ?? null : null

  const distancia =
    clienteCoords && selectedItem
      ? haversineKm(clienteCoords, { lat: selectedItem.lat, lng: selectedItem.lng })
      : null

  return (
    <div className={cn("relative z-0 isolate", className)} style={{ height }}>
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
        <FlyToSelected items={items} selectedId={selectedId} clienteCoords={clienteCoords} />

        {/* Marcador del cliente (azul) */}
        {clienteCoords && (
          <Marker
            position={[clienteCoords.lat, clienteCoords.lng]}
            icon={clientePin}
            zIndexOffset={2000}
          >
            <Popup>
              <p className="text-sm font-semibold">Tu ubicación</p>
            </Popup>
          </Marker>
        )}

        {/* Línea de distancia cliente → técnico seleccionado */}
        {clienteCoords && selectedItem && distancia != null && (
          <Polyline
            positions={[
              [clienteCoords.lat, clienteCoords.lng],
              [selectedItem.lat, selectedItem.lng],
            ]}
            pathOptions={{ color: "#2563eb", weight: 2.5, dashArray: "9 5", opacity: 0.75 }}
          >
            <Tooltip
              permanent
              sticky={false}
              direction="center"
              offset={[0, 0]}
              className="distance-tooltip"
            >
              <span style={{ fontWeight: 600, fontSize: "12px", color: "#2563eb" }}>
                {formatKm(distancia)}
              </span>
            </Tooltip>
          </Polyline>
        )}

        {/* Marcadores de técnicos */}
        {items.map((t) => (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={tecnicoPin(hoveredId === t.id, selectedId === t.id)}
            eventHandlers={{
              mouseover: () => onHover?.(t.id),
              mouseout: () => onHover?.(null),
              click: () => onSelect?.(selectedId === t.id ? null : t.id),
            }}
          >
            <Popup>
              <div className="min-w-28 space-y-0.5">
                <p className="font-semibold">{t.nombre}</p>
                {t.subtitulo && (
                  <p className="text-xs text-muted-foreground">{t.subtitulo}</p>
                )}
                {t.precio && <p className="text-xs font-medium">{t.precio}</p>}
                {clienteCoords && distancia != null && selectedId === t.id && (
                  <p className="text-xs font-medium text-blue-600">
                    a {formatKm(distancia)} de ti
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
