import { apiPost } from "@/lib/axios"

export type TipoReporte =
  | "COMPORTAMIENTO"
  | "FRAUDE"
  | "CALIDAD"
  | "ACOSO"
  | "OTRO"

export interface CreateReporteRequest {
  idServicio: string
  idReportado: string
  tipoReporte: TipoReporte
  motivo: string
  descripcionDetallada: string
}

export const denunciasApi = {
  crear: (body: CreateReporteRequest) =>
    apiPost<void>("/api/v1/services/reportes", body),
}
