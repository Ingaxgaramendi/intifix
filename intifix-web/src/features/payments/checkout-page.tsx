import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ReceiptText,
  Plus,
  Trash2,
  Lock,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { paths } from "@/routes/paths"
import { useAuthStore } from "@/stores/auth-store"
import { useServicioDetalle } from "@/features/services/use-services"
import { cotizacionMonto } from "@/types/service"
import { comisionBruta, computeBreakdown, isPagoPagado } from "@/types/payment"
import {
  useFacturaByPago,
  useGenerarFactura,
  useMetodosPago,
  usePagarServicio,
  usePagoByServicio,
} from "./use-payments"
import {
  BRAND_LABEL,
  resolveMetodoId,
  useSavedCards,
  type MetodoTipo,
} from "./payment-methods"
import { CardForm, type NewCardState } from "./card-form"
import { WalletPanel } from "./wallet-panel"
import { descargarComprobante, type ComprobanteData } from "./comprobante"

function BreakdownRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", bold && "border-t border-border pt-3")}>
      <span className={cn("text-sm", bold ? "font-semibold" : "text-muted-foreground")}>{label}</span>
      <span className={cn(bold ? "text-base font-bold" : "text-sm font-medium")}>{formatCurrency(value)}</span>
    </div>
  )
}

const TIPOS: { tipo: MetodoTipo; label: string; icon: typeof CreditCard }[] = [
  { tipo: "TARJETA", label: "Tarjeta", icon: CreditCard },
  { tipo: "YAPE", label: "Yape", icon: Smartphone },
  { tipo: "PLIN", label: "Plin", icon: Smartphone },
]

export function CheckoutPage() {
  const { idServicio = "" } = useParams<{ idServicio: string }>()
  const user = useAuthStore((s) => s.user)
  const uid = user?.idUsuario
  const servicio = useServicioDetalle(idServicio)
  const pago = usePagoByServicio(idServicio)
  const metodos = useMetodosPago()
  const pagar = usePagarServicio(idServicio)
  const { cards, addCard, removeCard } = useSavedCards(uid)

  const paid = isPagoPagado(pago.data)
  const factura = useFacturaByPago(pago.data?.idPago, paid)
  const generarFactura = useGenerarFactura(pago.data?.idPago)

  const [montoTotal, setMontoTotal] = useState<number>(0)
  const [tipo, setTipo] = useState<MetodoTipo>("TARJETA")
  const [selectedCardId, setSelectedCardId] = useState<string>("")
  const [agregando, setAgregando] = useState(false)
  const [newCard, setNewCard] = useState<NewCardState | null>(null)
  const [codigo, setCodigo] = useState("")

  // Prefill the amount from the accepted quote (or the service budget) once.
  useEffect(() => {
    const s = servicio.data
    if (!s) return
    const accepted = s.cotizaciones?.find((c) => String(c.estado).toUpperCase() === "ACEPTADA")
    const base = (accepted ? cotizacionMonto(accepted) : undefined) ?? s.presupuestoMaximo ?? 0
    setMontoTotal(base)
  }, [servicio.data])

  // Selecciona la primera tarjeta guardada por defecto.
  useEffect(() => {
    if (cards.length && !selectedCardId) setSelectedCardId(cards[0].id)
  }, [cards, selectedCardId])

  const breakdown = useMemo(() => computeBreakdown(montoTotal || 0), [montoTotal])
  // Sin tarjetas guardadas, o si el usuario elige "agregar", se usa el formulario.
  const cardMode: "saved" | "new" = agregando || cards.length === 0 ? "new" : "saved"

  if (servicio.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }
  if (servicio.isError || !servicio.data) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="mt-4 font-medium">No encontramos este servicio</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={paths.cliente.servicios}>Volver</Link>
        </Button>
      </div>
    )
  }

  const s = servicio.data

  // Solo para el aviso de "sin métodos"; no bloquea el botón (handlePay valida).
  const metodoOk = !!resolveMetodoId(tipo, metodos.data)

  const handlePay = async () => {
    // Validaciones con feedback claro (el botón siempre es clickeable).
    if (montoTotal <= 0) {
      toast.error("Este servicio aún no tiene un monto acordado para pagar.")
      return
    }
    const idMetodoPago = resolveMetodoId(tipo, metodos.data)
    if (!idMetodoPago) {
      toast.error("No hay métodos de pago configurados en la plataforma.")
      return
    }

    let metadata: Record<string, string> = { metodo: tipo }
    let saveCard: (() => void) | undefined

    if (tipo === "TARJETA") {
      if (cardMode === "new") {
        if (!newCard?.valid) {
          toast.error("Revisa los datos de la tarjeta (número, vencimiento y CVC).")
          return
        }
        metadata = { metodo: "TARJETA", marca: BRAND_LABEL[newCard.brand], ultimos4: newCard.last4 }
        const nc = newCard
        if (nc.guardar && uid) {
          saveCard = () => addCard({ brand: nc.brand, last4: nc.last4, exp: nc.exp, holder: nc.holder })
        }
      } else {
        const card = cards.find((c) => c.id === selectedCardId)
        if (!card) {
          toast.error("Selecciona una tarjeta para pagar.")
          return
        }
        metadata = { metodo: "TARJETA", marca: BRAND_LABEL[card.brand], ultimos4: card.last4 }
      }
    } else {
      metadata = { metodo: tipo }
      if (codigo.length === 6) metadata.codigoOperacion = codigo
    }

    try {
      await pagar.mutateAsync({ body: { idServicio, idMetodoPago, ...breakdown }, descripcion: `Pago servicio: ${s.titulo}`, metadata })
      saveCard?.()
    } catch {
      // El error ya es notificado por el interceptor de axios y el hook onError.
    }
  }

  const verComprobante = (
    tipo: ComprobanteData["tipo"],
    codigo?: string,
    fecha?: string,
  ) => {
    const p = pago.data
    const d = {
      comisionPlataforma: p?.comisionPlataforma ?? breakdown.comisionPlataforma,
      impuestoTotal: p?.impuestoTotal ?? breakdown.impuestoTotal,
      montoNetoTecnico: p?.montoNetoTecnico ?? breakdown.montoNetoTecnico,
      montoTotal: p?.montoTotal ?? breakdown.montoTotal,
    }
    const metodoNombre = metodos.data?.find((m) => m.idMetodoPago === p?.idMetodoPago)?.nombre
    const nombre =
      [user?.nombre, user?.apellidos].filter(Boolean).join(" ").trim() ||
      (user?.correo as string | undefined) ||
      "Cliente"
    const ok = descargarComprobante({
      tipo,
      codigo: codigo ?? "—",
      fecha,
      cliente: nombre,
      clienteDoc: (user?.dni as string | undefined) ?? (user?.ruc as string | undefined),
      servicio: s.titulo,
      montoNetoTecnico: d.montoNetoTecnico,
      comisionBruta: comisionBruta(d),
      impuestoTotal: d.impuestoTotal,
      montoTotal: d.montoTotal,
      metodo: metodoNombre,
      transactionId: p?.transactionId,
    })
    if (!ok) {
      toast.error("Permite las ventanas emergentes para ver el comprobante en PDF.")
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={paths.cliente.servicioDetalle(idServicio)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al servicio
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Pago del servicio</h1>
        <p className="mt-1 text-muted-foreground">{s.titulo}</p>
      </header>

      {paid ? (
        /* ---- Paid state ---- */
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl border border-success/30 bg-success/5 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold">Pago realizado</p>
              <p className="text-sm text-muted-foreground">
                {pago.data?.transactionId
                  ? `Transacción ${pago.data.transactionId}`
                  : "Tu pago fue procesado correctamente."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Detalle</h2>
            <div className="mt-4 space-y-3">
              {(() => {
                const d = {
                  comisionPlataforma: pago.data?.comisionPlataforma ?? breakdown.comisionPlataforma,
                  impuestoTotal: pago.data?.impuestoTotal ?? breakdown.impuestoTotal,
                  montoNetoTecnico: pago.data?.montoNetoTecnico ?? breakdown.montoNetoTecnico,
                  montoTotal: pago.data?.montoTotal ?? breakdown.montoTotal,
                }
                return (
                  <>
                    <BreakdownRow label="Neto al técnico" value={d.montoNetoTecnico} />
                    <BreakdownRow label="Comisión INTIFIX (1%)" value={comisionBruta(d)} />
                    <div className="flex items-center justify-between pl-3">
                      <span className="text-xs text-muted-foreground">— IGV (18%) sobre la comisión</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(d.impuestoTotal)}</span>
                    </div>
                    <BreakdownRow label="Total pagado" value={d.montoTotal} bold />
                  </>
                )
              })()}
            </div>
          </div>

          {/* Invoice */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="inline-flex items-center gap-2 font-semibold">
                <ReceiptText className="h-5 w-5 text-primary" />
                Comprobante
              </h2>
              {factura.data?.codigoComprobante && (
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
                  {factura.data.tipo} · {factura.data.codigoComprobante}
                </span>
              )}
            </div>
            {factura.isLoading ? (
              <Skeleton className="mt-4 h-10 w-40 rounded-lg" />
            ) : factura.data ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  {factura.data.tipo === "FACTURA" ? "Factura" : "Boleta"} emitida correctamente.
                  Puedes verla o descargarla en PDF.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => verComprobante(factura.data.tipo, factura.data.codigoComprobante, factura.data.fechaEmision)}
                  >
                    <Download className="h-4 w-4" /> Ver / Descargar PDF
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  Aún no generas tu comprobante. Elige el tipo:
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generarFactura.isPending}
                    onClick={() => generarFactura.mutate("BOLETA")}
                  >
                    {generarFactura.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Generar boleta
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generarFactura.isPending}
                    onClick={() => generarFactura.mutate("FACTURA")}
                  >
                    Generar factura
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ---- Checkout state ---- */
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Method + amount */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monto acordado</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Fijo
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(montoTotal)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Corresponde a la cotización que aceptaste. Por seguridad no se puede modificar.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Método de pago</h2>

              {/* Selector de tipo */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {TIPOS.map(({ tipo: tp, label, icon: Icon }) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setTipo(tp)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-all",
                      tipo === tp
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", tipo === tp ? "text-primary" : "text-muted-foreground")} />
                    {label}
                  </button>
                ))}
              </div>

              {!metodos.isLoading && !metodoOk && (
                <p className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
                  No hay métodos de pago configurados en la plataforma.
                </p>
              )}

              {/* Contenido según tipo */}
              <div className="mt-5">
                {tipo === "TARJETA" ? (
                  <div className="space-y-3">
                    {/* Tarjetas guardadas */}
                    {cards.length > 0 && !agregando && (
                      <div className="space-y-2">
                        {cards.map((c) => (
                          <div
                            key={c.id}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border p-3 transition-all",
                              selectedCardId === c.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:border-primary/40",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedCardId(c.id)}
                              className="flex flex-1 items-center gap-3 text-left"
                            >
                              <CreditCard className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">
                                  {BRAND_LABEL[c.brand]} •••• {c.last4}
                                </p>
                                <p className="text-xs text-muted-foreground">Vence {c.exp}</p>
                              </div>
                              <span
                                className={cn(
                                  "ml-auto h-4 w-4 shrink-0 rounded-full border",
                                  selectedCardId === c.id ? "border-primary bg-primary" : "border-border",
                                )}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCard(c.id)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                              aria-label="Eliminar tarjeta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setAgregando(true)}>
                          <Plus className="h-4 w-4" /> Agregar otra tarjeta
                        </Button>
                      </div>
                    )}

                    {/* Formulario nueva tarjeta */}
                    {cardMode === "new" && (
                      <div className="space-y-3">
                        <CardForm onChange={setNewCard} />
                        {cards.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => setAgregando(false)}>
                            Usar una tarjeta guardada
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <WalletPanel tipo={tipo} monto={breakdown.montoTotal} codigo={codigo} onCodigo={setCodigo} />
                )}
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Resumen</h2>
              <div className="mt-4 space-y-3">
                <BreakdownRow label="Neto al técnico" value={breakdown.montoNetoTecnico} />
                <BreakdownRow label="Comisión INTIFIX (1%)" value={comisionBruta(breakdown)} />
                <div className="flex items-center justify-between pl-3">
                  <span className="text-xs text-muted-foreground">— IGV (18%) sobre la comisión</span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(breakdown.impuestoTotal)}</span>
                </div>
                <BreakdownRow label="Total a pagar" value={breakdown.montoTotal} bold />
              </div>
              <Button className="mt-6 h-11 w-full text-base" disabled={pagar.isPending} onClick={handlePay}>
                {pagar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {tipo === "TARJETA" ? `Pagar ${formatCurrency(breakdown.montoTotal)}` : "Confirmar pago"}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Pago protegido por INTIFIX · cifrado de extremo a extremo
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
