import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import { cn } from "@/lib/utils"

const wineMarker = L.divIcon({
  className: "intifix-marker",
  html: '<div style="width:20px;height:20px;border-radius:9999px;background:#7B1F2D;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

/** Read-only map with a single marker. No interaction — for showing a fixed point. */
export function StaticMap({
  lat,
  lng,
  height = 200,
  zoom = 15,
  className,
}: {
  lat: number
  lng: number
  height?: number
  zoom?: number
  className?: string
}) {
  return (
    // `isolate` confina los z-index internos de Leaflet (sus panes llegan a 400)
    // para que el mapa nunca se pinte encima del navbar sticky (z-40).
    <div className={cn("relative z-0 isolate", className)} style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full overflow-hidden rounded-2xl"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={wineMarker} />
      </MapContainer>
    </div>
  )
}
