import { apiGet, apiPost } from "@/lib/axios"
import type {
  CreateFacturaRequest,
  CreatePagoRequest,
  Factura,
  MetodoPago,
  Pago,
  ProcesarPagoRequest,
} from "@/types/payment"

export const paymentsApi = {
  methods: () => apiGet<MetodoPago[]>("/api/v1/payments/methods"),

  create: (body: CreatePagoRequest) => apiPost<Pago>("/api/v1/payments", body),

  procesar: (body: ProcesarPagoRequest) => apiPost<Pago>("/api/v1/payments/procesar", body),

  get: (idPago: string) => apiGet<Pago>(`/api/v1/payments/${idPago}`),

  // May return a single payment or a list depending on the backend — tolerated.
  byServicio: (idServicio: string) =>
    apiGet<Pago | Pago[] | null>(`/api/v1/payments/servicio/${idServicio}`),

  invoiceByPago: (idPago: string) =>
    apiGet<Factura>(`/api/v1/payments/invoices/pago/${idPago}`),

  invoiceByCodigo: (codigo: string) =>
    apiGet<Factura>(`/api/v1/payments/invoices/codigo/${codigo}`),

  createInvoice: (body: CreateFacturaRequest) =>
    apiPost<Factura>("/api/v1/payments/invoices", body),
}
