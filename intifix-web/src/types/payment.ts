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
  [key: string]: unknown
}

export interface CreateFacturaRequest {
  idPago: string
  tipo: TipoComprobante
  codigoComprobante?: string
  idFacturaReferencia?: string
}

/** Platform commission and IGV rates used to derive the payment breakdown. */
export const COMISION_RATE = 0.1
export const IGV_RATE = 0.18

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Frontend-computed breakdown from a gross amount. The backend requires these
 * four fields on create; adjust the rates if your platform uses different ones.
 */
export function computeBreakdown(montoTotal: number) {
  const comisionPlataforma = round2(montoTotal * COMISION_RATE)
  const impuestoTotal = round2(montoTotal * IGV_RATE)
  const montoNetoTecnico = round2(montoTotal - comisionPlataforma)
  return { montoTotal: round2(montoTotal), comisionPlataforma, impuestoTotal, montoNetoTecnico }
}

const PAID_STATES = ["PROCESADO", "PAGADO", "COMPLETADO", "CONFIRMADO"]
export const isPagoPagado = (p?: Pago | null): boolean =>
  !!p && PAID_STATES.includes(String(p.estado ?? "").toUpperCase())
