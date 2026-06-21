import { apiGet, apiPost } from "@/lib/axios"
import type { Ubicacion } from "@/types/service"

/** POST /api/v1/ubicaciones body. lat/lng come from the Leaflet picker. */
export interface CreateUbicacionRequest {
  departamento: string
  provincia: string
  distrito: string
  direccionTexto: string
  referencia?: string
  latitud: number
  longitud: number
}

export const ubicacionesApi = {
  create: (body: CreateUbicacionRequest) => apiPost<Ubicacion>("/api/v1/ubicaciones", body),
  get: (id: string) => apiGet<Ubicacion>(`/api/v1/ubicaciones/${id}`),
}
