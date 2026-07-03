import { useMemo } from "react"
import { Smartphone, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { onlyDigits } from "./payment-methods"

/** Número de la cuenta recaudadora de INTIFIX (demo). */
const INTIFIX_PHONE = "987 654 321"

const WALLET = {
  YAPE: { label: "Yape", color: "#6d2b8e", accent: "bg-[#6d2b8e]", soft: "bg-[#6d2b8e]/10 text-[#6d2b8e]" },
  PLIN: { label: "Plin", color: "#0aa5a5", accent: "bg-[#0aa5a5]", soft: "bg-[#0aa5a5]/10 text-[#0aa5a5]" },
} as const

/** QR determinista (decorativo) generado a partir de una semilla — parece real. */
function FauxQR({ seed, color = "#111" }: { seed: string; color?: string }) {
  const N = 25
  const cells = useMemo(() => {
    // Hash simple → secuencia pseudoaleatoria estable por semilla.
    let h = 2166136261
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    const rnd = () => {
      h ^= h << 13
      h ^= h >>> 17
      h ^= h << 5
      return ((h >>> 0) % 1000) / 1000
    }
    const grid: boolean[] = []
    for (let i = 0; i < N * N; i++) grid.push(rnd() > 0.5)
    return grid
  }, [seed])

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7
    return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0)
  }

  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="h-44 w-44" shapeRendering="crispEdges" role="img" aria-label="Código QR">
      <rect width={N} height={N} fill="white" />
      {cells.map((on, i) => {
        const r = Math.floor(i / N)
        const c = i % N
        if (isFinder(r, c)) return null
        return on ? <rect key={i} x={c} y={r} width={1} height={1} fill={color} /> : null
      })}
      {/* Tres "finder patterns" como un QR real */}
      {[
        [0, 0],
        [0, N - 7],
        [N - 7, 0],
      ].map(([y, x], i) => (
        <g key={i}>
          <rect x={x} y={y} width={7} height={7} fill={color} />
          <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} fill={color} />
        </g>
      ))}
    </svg>
  )
}

/**
 * Panel de pago con billetera móvil (Yape/Plin): muestra el QR para escanear con
 * la app, el número de la cuenta recaudadora y pide el código de aprobación de 6
 * dígitos que la app genera al confirmar — igual que un cobro real por QR.
 */
export function WalletPanel({
  tipo,
  monto,
  codigo,
  onCodigo,
}: {
  tipo: "YAPE" | "PLIN"
  monto: number
  codigo: string
  onCodigo: (v: string) => void
}) {
  const w = WALLET[tipo]
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className={cn("flex items-center gap-2 px-5 py-3 text-white", w.accent)}>
        <Smartphone className="h-5 w-5" />
        <span className="font-semibold">Pagar con {w.label}</span>
        <span className="ml-auto font-bold">{formatCurrency(monto)}</span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="mx-auto rounded-xl border border-border bg-white p-2">
          <FauxQR seed={`${tipo}:${monto}:${INTIFIX_PHONE}`} color={w.color} />
        </div>
        <div className="space-y-3 text-sm">
          <ol className="space-y-2 text-muted-foreground">
            <li>
              1. Abre <span className="font-medium text-foreground">{w.label}</span> y escanea el QR, o envía a{" "}
              <span className="font-semibold text-foreground">{INTIFIX_PHONE}</span> (INTIFIX SAC).
            </li>
            <li>
              2. Paga el monto exacto de <span className="font-semibold text-foreground">{formatCurrency(monto)}</span>.
            </li>
            <li>
              3. Vuelve aquí y pulsa <span className="font-medium text-foreground">Confirmar pago</span>.
            </li>
          </ol>

          <div className="space-y-2">
            <Label htmlFor="wallet-code">Código de operación (opcional)</Label>
            <Input
              id="wallet-code"
              inputMode="numeric"
              placeholder="Ej. 123456"
              maxLength={6}
              className="h-11 max-w-[12rem] text-center font-mono text-lg tracking-[0.4em]"
              value={codigo}
              onChange={(e) => onCodigo(onlyDigits(e.target.value).slice(0, 6))}
            />
            <p className="text-xs text-muted-foreground">
              Lo encuentras en la constancia de tu pago en {w.label} (sirve de respaldo).
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Pago verificado de forma segura. Nunca compartas tu clave de {w.label}.
          </p>
        </div>
      </div>
    </div>
  )
}
