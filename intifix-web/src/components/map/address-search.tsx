import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin, Search } from "lucide-react"
import { geocode, type GeocodeResult } from "@/api/geocode"
import { Input } from "@/components/ui/input"

/**
 * Buscador de direcciones (geocoding OpenStreetMap). Muestra sugerencias mientras
 * se escribe; al elegir una, llama a {@link onSelect} con coordenadas + dirección.
 */
export function AddressSearch({
  onSelect,
  placeholder = "Buscar dirección, calle o lugar…",
}: {
  onSelect: (r: GeocodeResult) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Debounce + cancelación de la petición anterior.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await geocode(q, ctrl.signal)
        setResults(r)
        setOpen(true)
      } catch {
        /* abortado o error de red: ignorar */
      } finally {
        setLoading(false)
      }
    }, 450)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  // Cerrar el panel al hacer clic fuera.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const pick = (r: GeocodeResult) => {
    onSelect(r)
    setQuery(r.direccion)
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          className="h-11 pl-9 pr-9"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-2">{r.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.trim().length >= 3 && results.length === 0 && (
        <div className="absolute z-[1000] mt-1 w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
          Sin resultados. Marca el punto en el mapa.
        </div>
      )}
    </div>
  )
}
