import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { paymentsApi } from "@/api/payments"
import type { CreatePagoRequest, Pago } from "@/types/payment"

const firstPago = (data: Pago | Pago[] | null): Pago | null =>
  Array.isArray(data) ? data[0] ?? null : data ?? null

export function useMetodosPago() {
  return useQuery({
    queryKey: ["metodos-pago"],
    queryFn: paymentsApi.methods,
    staleTime: 10 * 60_000,
  })
}

export function usePagoByServicio(idServicio: string) {
  return useQuery({
    queryKey: ["pago-servicio", idServicio],
    queryFn: async () => firstPago(await paymentsApi.byServicio(idServicio)),
    enabled: !!idServicio,
  })
}

export function useFacturaByPago(idPago: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["factura-pago", idPago],
    queryFn: () => paymentsApi.invoiceByPago(idPago!),
    enabled: !!idPago && enabled,
    retry: false,
  })
}

/** Create the payment then process it in one step (CLIENTE checkout). */
export function usePagarServicio(idServicio: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ body, descripcion }: { body: CreatePagoRequest; descripcion?: string }) => {
      const pago = await paymentsApi.create(body)
      return paymentsApi.procesar({ idPago: pago.idPago, descripcion })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pago-servicio", idServicio] })
      toast.success("Pago procesado")
    },
  })
}

export function useGenerarFactura(idPago: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tipo: "BOLETA" | "FACTURA") =>
      paymentsApi.createInvoice({ idPago: idPago!, tipo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["factura-pago", idPago] })
      toast.success("Comprobante generado")
    },
  })
}
