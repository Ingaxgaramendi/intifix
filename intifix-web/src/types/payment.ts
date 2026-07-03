export interface MetodoPago {
  idMetodoPago: string
  nombre: string
  [key: string]: unknown
}

export type EstadoPago =
  | "PENDIENTE"
  | "PROCESANDO"
  | "PROCESADO"
  | "PAGADO"
  | "COMPLETADO"
  | "CONFIRMADO"
  | "REEMBOLSADO"
  | "FALLIDO"
  | (string & {})

export interface Pago {
  idPago: string
  idServicio: string
  idMetodoPago?: string
  montoTotal?: number
  comisionPlataforma?: number
  montoNetoTecnico?: number
  impuestoTotal?: number
  estado?: EstadoPago
  transactionId?: string
  fechaCreacion?: string
  [key: string]: unknown
}

/** POST /api/v1/payments — all amounts have 2 decimals. */
export interface CreatePagoRequest {
  idServicio: string
  idMetodoPago: string
  montoTotal: number
  comisionPlataforma: number
  montoNetoTecnico: number
  impuestoTotal: number
}

export interface ProcesarPagoRequest {
  idPago: string
  descripcion?: string
  metadata?: Record<string, string>
}

export type TipoComprobante = "BOLETA" | "FACTURA" | "NOTA_CREDITO"

export interface Factura {
  idFactura: string
  idPago: string
  tipo: TipoComprobante
  codigoComprobante?: string
  estadoFiscal?: string
  urlPdf?: string
  fechaEmision?: string
  [key: string]: unknown
}

export interface CreateFacturaRequest {
  idPago: string
  tipo: TipoComprobante
  codigoComprobante?: string
  idFacturaReferencia?: string
}

/** Comisión de plataforma e IGV (Perú) usados para derivar el desglose del pago. */
export const COMISION_RATE = 0.01
export const IGV_RATE = 0.18

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Desglose del pago (modelo MARKETPLACE/intermediación). El cliente paga el total;
 * la plataforma cobra una comisión por intermediar y el IGV grava SOLO esa comisión
 * (no el servicio del técnico). El técnico recibe el resto.
 *
 * Las tres partes SUMAN exactamente el total —como exige el backend
 * (`comisiónNeta + netoTécnico + IGV == total`):
 *  - comisión bruta      = total × 1%            (lo que cobra INTIFIX, IGV incl.)
 *  - IGV (s/ comisión)   = comisiónBruta × 18/118
 *  - comisión neta       = comisiónBruta − IGV   (ingreso real de la plataforma)
 *  - neto al técnico     = total − comisiónBruta
 * Restando valores ya redondeados a 2 decimales, la suma cuadra al céntimo.
 */
export function computeBreakdown(montoTotal: number) {
  const total = round2(montoTotal)
  const comisionBruta = round2(total * COMISION_RATE)
  const impuestoTotal = round2((comisionBruta * IGV_RATE) / (1 + IGV_RATE))
  const comisionPlataforma = round2(comisionBruta - impuestoTotal)
  const montoNetoTecnico = round2(total - comisionBruta)
  return { montoTotal: total, comisionPlataforma, impuestoTotal, montoNetoTecnico }
}

/** Comisión total que cobra la plataforma (neta + IGV), para mostrar al usuario. */
export const comisionBruta = (b: { comisionPlataforma: number; impuestoTotal: number }) =>
  round2(b.comisionPlataforma + b.impuestoTotal)

/**
 * Modo inverso (gross-up): a partir del monto NETO que el técnico quiere recibir,
 * calcula el precio que debe pagar el cliente para que, tras la comisión del 1%,
 * al técnico le quede exactamente ese neto. precioCliente = neto / (1 − 1%).
 */
export function grossFromNet(neto: number): number {
  if (!neto || neto <= 0) return 0
  return round2(neto / (1 - COMISION_RATE))
}

const PAID_STATES = ["PROCESADO", "PAGADO", "COMPLETADO", "CONFIRMADO"]
export const isPagoPagado = (p?: Pago | null): boolean =>
  !!p && PAID_STATES.includes(String(p.estado ?? "").toUpperCase())
