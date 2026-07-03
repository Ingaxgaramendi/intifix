import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
import { cn } from "@/lib/utils"

export interface LatLng {
  lat: number
  lng: number
}

// Lima, Peru as a sensible default center.
const DEFAULT_CENTER: LatLng = { lat: -12.0464, lng: -77.0428 }

const coralMarker = L.divIcon({
  className: "intifix-marker",
  html: '<div style="width:22px;height:22px;border-radius:9999px;background:#FF385C;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function ClickCapture({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

/** Recentra (y acerca) el mapa cuando el valor cambia desde fuera (buscador/selects). */
function Recenter({ value, zoom }: { value?: LatLng | null; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], zoom ?? Math.max(map.getZoom(), 16))
  }, [value?.lat, value?.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/**
 * Tap-to-place location picker. Click the map (or drag the pin) to set a point.
 * Used by the "pedir servicio" form; the same map style is reused in search.
 */
export function LocationPicker({
  value,
  onChange,
  className,
  height = 320,
}: {
  value?: LatLng | null
  onChange: (p: LatLng) => void
  className?: string
  height?: number
}) {
  const center = value ?? DEFAULT_CENTER
  const markerRef = useRef<L.Marker>(null)

  const dragHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current
        if (m) {
          const ll = m.getLatLng()
          onChange({ lat: ll.lat, lng: ll.lng })
        }
      },
    }),
    [onChange],
  )

  return (
    <div
      className={cn("relative z-0 isolate", className)}
      style={{ height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full overflow-hidden rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onPick={onChange} />
        <Recenter value={value} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={coralMarker}
            draggable
            eventHandlers={dragHandlers}
            ref={markerRef}
          />
        )}
      </MapContainer>
    </div>
  )
}
