/** Utilidades de geolocalización para distancias cliente↔técnico. */

export interface LatLngPoint {
  lat: number
  lng: number
}

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Distancia en kilómetros entre dos coordenadas (fórmula de Haversine). */
export function haversineKm(a: LatLngPoint, b: LatLngPoint): number {
  const R = 6371 // radio terrestre en km
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Formatea una distancia: "850 m", "1.2 km" o "" si no hay dato. */
export function formatKm(km?: number | null): string {
  if (km == null || !Number.isFinite(km)) return ""
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
