/**
 * Geocoding gratuito vía Nominatim (OpenStreetMap). Sin API key.
 * Limitado a Perú. Respeta el límite de ~1 req/seg de Nominatim usando debounce
 * en el componente que lo consume.
 */
export interface GeocodeResult {
  lat: number
  lng: number
  /** Texto completo que muestra el geocoder. */
  displayName: string
  /** Línea de calle/dirección corta para la casilla "Dirección". */
  direccion: string
  departamento?: string
  provincia?: string
  distrito?: string
}

interface NominatimAddress {
  road?: string
  pedestrian?: string
  house_number?: string
  neighbourhood?: string
  suburb?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  province?: string
  /** En Perú la provincia (admin nivel 6) suele llegar aquí, p.ej. "Lima Metropolitana". */
  state_district?: string
  region?: string
  state?: string
}

interface NominatimItem {
  lat: string
  lon: string
  display_name: string
  address?: NominatimAddress
}

function buildDireccion(a: NominatimAddress | undefined, fallback: string): string {
  if (!a) return fallback
  const calle = a.road ?? a.pedestrian
  if (calle) return a.house_number ? `${calle} ${a.house_number}` : calle
  return a.neighbourhood ?? a.suburb ?? fallback.split(",")[0]
}

function toResult(it: NominatimItem): GeocodeResult {
  const a = it.address
  const distrito = a?.city ?? a?.town ?? a?.village ?? a?.municipality ?? a?.city_district
  // Provincia: Nominatim la entrega de forma inconsistente en Perú. La mayoría de
  // las veces llega en `state_district`; si no, usamos el distrito como aproximación
  // (el distrito capital comparte nombre con su provincia).
  const provincia = a?.province ?? a?.county ?? a?.state_district ?? distrito
  return {
    lat: Number(it.lat),
    lng: Number(it.lon),
    displayName: it.display_name,
    direccion: buildDireccion(a, it.display_name),
    departamento: a?.region ?? a?.state,
    provincia,
    distrito,
  }
}

/**
 * Expande abreviaturas de vías muy comunes en Perú para que coincidan con los
 * nombres completos que guarda OpenStreetMap (mejora la búsqueda de calles).
 * Ej.: "Av. Pardo" -> "Avenida Pardo", "Jr. Lima" -> "Jirón Lima".
 */
function expandirVias(q: string): string {
  const map: Record<string, string> = {
    "av": "avenida",
    "avda": "avenida",
    "jr": "jirón",
    "ca": "calle",
    "cl": "calle",
    "psje": "pasaje",
    "pje": "pasaje",
    "pasj": "pasaje",
    "prol": "prolongación",
    "mz": "manzana",
    "urb": "urbanización",
    "carr": "carretera",
  }
  return q.replace(/\b([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)\.?/g, (full, word: string) => {
    const repl = map[word.toLowerCase()]
    return repl ?? full
  })
}

/** Búsqueda por texto (autocompletado del buscador). */
export async function geocode(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const raw = query.trim()
  if (raw.length < 3) return []
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("countrycodes", "pe")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("limit", "10")
  url.searchParams.set("dedupe", "1")
  url.searchParams.set("accept-language", "es")
  url.searchParams.set("q", expandirVias(raw))

  const res = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } })
  if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`)
  const items = (await res.json()) as NominatimItem[]
  return items.map(toResult)
}

/** Geocoding inverso: de coordenadas (pin del mapa) a dirección + ubigeo. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("accept-language", "es")
  url.searchParams.set("zoom", "18")
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lng))

  const res = await fetch(url.toString(), { signal, headers: { Accept: "application/json" } })
  if (!res.ok) throw new Error(`Reverse geocode HTTP ${res.status}`)
  const item = (await res.json()) as NominatimItem & { error?: string }
  if (item.error || !item.lat) return null
  return toResult(item)
}
