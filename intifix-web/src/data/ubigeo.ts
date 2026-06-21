import raw from "./ubigeo-peru.json"

/**
 * Ubigeo del Perú (fuente: INEI, 25 departamentos · 196 provincias · 1893 distritos).
 * Estructura: departamento -> provincia -> distrito -> [lat, lng] (coords del distrito).
 */
type Coords = [number | null, number | null]
type Ubigeo = Record<string, Record<string, Record<string, Coords>>>

const data = raw as unknown as Ubigeo

const collator = new Intl.Collator("es", { sensitivity: "base" })
const sortEs = (a: string, b: string) => collator.compare(a, b)

export const departamentos: string[] = Object.keys(data).sort(sortEs)

export function provincias(departamento: string): string[] {
  const d = data[departamento]
  return d ? Object.keys(d).sort(sortEs) : []
}

export function distritos(departamento: string, provincia: string): string[] {
  const p = data[departamento]?.[provincia]
  return p ? Object.keys(p).sort(sortEs) : []
}

/** Coordenadas (capital) del distrito, o null si no se conocen. */
export function distritoCoords(
  departamento: string,
  provincia: string,
  distrito: string,
): { lat: number; lng: number } | null {
  const c = data[departamento]?.[provincia]?.[distrito]
  if (!c || c[0] == null || c[1] == null) return null
  return { lat: c[0], lng: c[1] }
}

/**
 * Busca el departamento/provincia/distrito que mejor coincida con nombres sueltos
 * (p. ej. los que devuelve un geocoder). Comparación sin tildes ni mayúsculas.
 */
export function matchUbigeo(
  departamento?: string,
  provincia?: string,
  distrito?: string,
): { departamento: string; provincia: string; distrito: string } | null {
  const eq = (a: string, b?: string) => (b ? collator.compare(a, b) === 0 : false)
  for (const dep of departamentos) {
    if (departamento && !eq(dep, departamento)) continue
    for (const prov of provincias(dep)) {
      if (provincia && !eq(prov, provincia)) continue
      for (const dist of distritos(dep, prov)) {
        if (distrito && eq(dist, distrito)) {
          return { departamento: dep, provincia: prov, distrito: dist }
        }
      }
    }
  }
  return null
}
