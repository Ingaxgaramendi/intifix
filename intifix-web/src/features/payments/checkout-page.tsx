import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ReceiptText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { paths } from "@/routes/paths"
import { useServicioDetalle } from "@/features/services/use-services"
import { cotizacionMonto } from "@/types/service"
import { computeBreakdown, isPagoPagado } from "@/types/payment"
import {
  useFacturaByPago,
  useGenerarFactura,
  useMetodosPago,
  usePagarServicio,
  usePagoByServicio,
} from "./use-payments"

function BreakdownRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", bold && "border-t border-border pt-3")}>
      <span className={cn("text-sm", bold ? "font-semibold" : "text-muted-foreground")}>{label}</span>
      <span className={cn(bold ? "text-base font-bold" : "text-sm font-medium")}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}

export function CheckoutPage() {
  const { idServicio = "" } = useParams<{ idServicio: string }>()
  const servicio = useServicioDetalle(idServicio)
  const pago = usePagoByServicio(idServicio)
  const metodos = useMetodosPago()
  const pagar = usePagarServicio(idServicio)

  const paid = isPagoPagado(pago.data)
  const factura = useFacturaByPago(pago.data?.idPago, paid)
  const generarFactura = useGenerarFactura(pago.data?.idPago)

  const [montoTotal, setMontoTotal] = useState<number>(0)
  const [idMetodoPago, setIdMetodoPago] = useState<string>("")

  // Prefill the amount from the accepted quote (or the service budget) once.
  useEffect(() => {
    const s = servicio.data
    if (!s) return
    const accepted = s.cotizaciones?.find((c) => String(c.estado).toUpperCase() === "ACEPTADA")
    const base = (accepted ? cotizacionMonto(accepted) : undefined) ?? s.presupuestoMaximo ?? 0
    setMontoTotal(base)
  }, [servicio.data])

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
  const breakdown = computeBreakdown(montoTotal || 0)

  const handlePay = () => {
    pagar.mutate({
      body: { idServicio, idMetodoPago, ...breakdown },
      descripcion: `Pago servicio: ${s.titulo}`,
    })
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
              <BreakdownRow label="Comisión plataforma" value={pago.data?.comisionPlataforma ?? breakdown.comisionPlataforma} />
              <BreakdownRow label="Impuesto (IGV)" value={pago.data?.impuestoTotal ?? breakdown.impuestoTotal} />
              <BreakdownRow label="Neto al técnico" value={pago.data?.montoNetoTecnico ?? breakdown.montoNetoTecnico} />
              <BreakdownRow label="Total pagado" value={pago.data?.montoTotal ?? breakdown.montoTotal} bold />
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
              <p className="mt-3 text-sm text-muted-foreground">
                Comprobante {factura.data.tipo.toLowerCase()} emitido.
              </p>
            ) : (
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
            )}
          </div>
        </div>
      ) : (
        /* ---- Checkout state ---- */
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Method + amount */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <Label htmlFor="monto">Monto a pagar (S/)</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className="mt-2 h-11"
                value={montoTotal || ""}
                onChange={(e) => setMontoTotal(Number(e.target.value))}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Prellenado desde la cotización aceptada. Puedes ajustarlo si corresponde.
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Método de pago</h2>
              {metodos.isLoading ? (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              ) : metodos.data?.length ? (
                <div className="mt-4 space-y-2">
                  {metodos.data.map((m) => (
                    <button
                      key={m.idMetodoPago}
                      type="button"
                      onClick={() => setIdMetodoPago(m.idMetodoPago)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                        idMetodoPago === m.idMetodoPago
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-medium">{m.nombre}</span>
                      <span
                        className={cn(
                          "ml-auto h-4 w-4 rounded-full border",
                          idMetodoPago === m.idMetodoPago ? "border-primary bg-primary" : "border-border",
                        )}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No hay métodos de pago disponibles.
                </p>
              )}
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Resumen</h2>
              <div className="mt-4 space-y-3">
                <BreakdownRow label="Comisión plataforma" value={breakdown.comisionPlataforma} />
                <BreakdownRow label="Impuesto (IGV)" value={breakdown.impuestoTotal} />
                <BreakdownRow label="Neto al técnico" value={breakdown.montoNetoTecnico} />
                <BreakdownRow label="Total" value={breakdown.montoTotal} bold />
              </div>
              <Button
                className="mt-6 h-11 w-full text-base"
                disabled={!idMetodoPago || montoTotal <= 0 || pagar.isPending}
                onClick={handlePay}
              >
                {pagar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Pagar {formatCurrency(breakdown.montoTotal)}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Pago protegido por INTIFIX
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
