import { useQuery } from "@tanstack/react-query"
import { servicesApi } from "@/api/services"
import { paymentsApi } from "@/api/payments"
import { isPagoPagado, type Pago } from "@/types/payment"

function asPago(d: Pago | Pago[] | null): Pago | null {
  if (!d) return null
  return Array.isArray(d) ? (d[0] ?? null) : d
}

export interface IngresoItem {
  idServicio: string
  pago: Pago
}

export interface IngresosResumen {
  totalNeto: number
  totalBruto: number
  cobrados: number
  totalTrabajos: number
  items: IngresoItem[]
}

/**
 * Derives the technician's earnings: there's no dedicated endpoint, so we read
 * their assignments and look up the payment per service, summing the net amount
 * of the ones already paid.
 */
export function useIngresos(idTec: string | undefined) {
  return useQuery({
    queryKey: ["ingresos", idTec],
    enabled: !!idTec,
    queryFn: async (): Promise<IngresosResumen> => {
      const page = await servicesApi.asignacionesByTecnico(idTec!, { page: 0, size: 100 })
      const asignaciones = page.content ?? []
      const pagos = await Promise.all(
        asignaciones.map(async (a) => {
          try {
            return asPago(await paymentsApi.byServicio(a.idServicio))
          } catch {
            return null
          }
        }),
      )

      const items: IngresoItem[] = []
      let totalNeto = 0
      let totalBruto = 0
      asignaciones.forEach((a, i) => {
        const p = pagos[i]
        if (p && isPagoPagado(p)) {
          items.push({ idServicio: a.idServicio, pago: p })
          totalNeto += p.montoNetoTecnico ?? 0
          totalBruto += p.montoTotal ?? 0
        }
      })

      return {
        totalNeto,
        totalBruto,
        cobrados: items.length,
        totalTrabajos: asignaciones.length,
        items,
      }
    },
  })
}
