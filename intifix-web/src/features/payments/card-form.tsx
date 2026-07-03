import { useEffect, useState } from "react"
import { CreditCard, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  BRAND_LABEL,
  cvcLen,
  detectBrand,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  luhnValid,
  onlyDigits,
  type CardBrand,
} from "./payment-methods"

export interface NewCardState {
  valid: boolean
  brand: CardBrand
  last4: string
  exp: string
  holder: string
  guardar: boolean
}

const BRAND_GRADIENT: Record<CardBrand, string> = {
  visa: "from-[#1a1f71] via-[#2b3a9c] to-[#436fce]",
  mastercard: "from-[#3a1c0c] via-[#8a2d12] to-[#eb5b25]",
  amex: "from-[#0b5d8a] via-[#1a7fb8] to-[#3bb0d6]",
  diners: "from-[#1c3a5e] via-[#2a5a8a] to-[#4a86c5]",
  card: "from-primary via-primary/80 to-primary/50",
}

/** Formulario de tarjeta con preview en vivo (marca, número enmascarado, vencimiento). */
export function CardForm({ onChange }: { onChange: (s: NewCardState) => void }) {
  const [numero, setNumero] = useState("")
  const [exp, setExp] = useState("")
  const [cvc, setCvc] = useState("")
  const [holder, setHolder] = useState("")
  const [guardar, setGuardar] = useState(true)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const brand = detectBrand(numero)
  const digits = onlyDigits(numero)
  const numOk = luhnValid(numero)
  const expOk = expiryValid(exp)
  const cvcOk = cvc.length === cvcLen(brand)
  const holderOk = holder.trim().length >= 3
  const valid = numOk && expOk && cvcOk && holderOk

  useEffect(() => {
    onChange({ valid, brand, last4: digits.slice(-4), exp, holder: holder.trim(), guardar })
  }, [valid, brand, digits, exp, holder, guardar, onChange])

  const err = (key: string, ok: boolean) => touched[key] && !ok
  const mark = (key: string) => setTouched((t) => ({ ...t, [key]: true }))

  return (
    <div className="space-y-5">
      {/* Preview de la tarjeta */}
      <div
        className={cn(
          "relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg",
          BRAND_GRADIENT[brand],
        )}
      >
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-start justify-between">
          <span className="h-8 w-11 rounded-md bg-gradient-to-br from-yellow-200/90 to-yellow-400/80 shadow-inner" />
          <span className="text-sm font-semibold tracking-wide">{BRAND_LABEL[brand]}</span>
        </div>
        <p className="mt-6 font-mono text-lg tracking-[0.15em] sm:text-xl">
          {formatCardNumber(numero).padEnd(19, "•").replace(/(.{4}) /g, "$1 ")}
          {digits.length === 0 && "•••• •••• •••• ••••"}
        </p>
        <div className="mt-4 flex items-end justify-between text-xs">
          <div className="min-w-0">
            <p className="text-white/60">Titular</p>
            <p className="truncate font-medium uppercase">{holder || "NOMBRE APELLIDO"}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60">Vence</p>
            <p className="font-medium">{exp || "MM/AA"}</p>
          </div>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-2">
        <Label htmlFor="card-num">Número de tarjeta</Label>
        <div className="relative">
          <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="card-num"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            className="h-11 pl-9 font-mono"
            value={formatCardNumber(numero)}
            onChange={(e) => setNumero(onlyDigits(e.target.value).slice(0, brand === "amex" ? 15 : 16))}
            onBlur={() => mark("num")}
            aria-invalid={err("num", numOk)}
          />
        </div>
        {err("num", numOk) && <p className="text-sm text-destructive">Número de tarjeta inválido</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="card-exp">Vencimiento</Label>
          <Input
            id="card-exp"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            className="h-11"
            value={exp}
            onChange={(e) => setExp(formatExpiry(e.target.value))}
            onBlur={() => mark("exp")}
            aria-invalid={err("exp", expOk)}
          />
          {err("exp", expOk) && <p className="text-sm text-destructive">Fecha inválida</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="card-cvc">CVC</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="card-cvc"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={cvcLen(brand) === 4 ? "1234" : "123"}
              className="h-11 pl-9"
              value={cvc}
              onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, cvcLen(brand)))}
              onBlur={() => mark("cvc")}
              aria-invalid={err("cvc", cvcOk)}
            />
          </div>
          {err("cvc", cvcOk) && <p className="text-sm text-destructive">CVC inválido</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-holder">Titular de la tarjeta</Label>
        <Input
          id="card-holder"
          autoComplete="cc-name"
          placeholder="Como figura en la tarjeta"
          className="h-11"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          onBlur={() => mark("holder")}
          aria-invalid={err("holder", holderOk)}
        />
        {err("holder", holderOk) && <p className="text-sm text-destructive">Ingresa el nombre del titular</p>}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={guardar}
          onChange={(e) => setGuardar(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        Guardar esta tarjeta para próximos pagos
      </label>
    </div>
  )
}
