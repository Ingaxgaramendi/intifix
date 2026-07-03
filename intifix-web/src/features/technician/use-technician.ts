import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiGet } from "@/lib/axios"
import { servicesApi } from "@/api/services"
import type { CreateCotizacionRequest, CreateEvidenciaRequest } from "@/types/service"

export const techKeys = {
  disponibles: (page: number) => ["disponibles", page] as const,
  directas: (page: number) => ["directas", page] as const,
  misCotizaciones: (idTec: string, page: number) => ["mis-cotizaciones", idTec, page] as const,
  misAsignaciones: (idTec: string, page: number) => ["mis-asignaciones", idTec, page] as const,
}

export function useServiciosDisponibles(page: number) {
  return useQuery({
    queryKey: techKeys.disponibles(page),
    queryFn: () => servicesApi.disponibles({ page, size: 12, sort: "fechaProgramada,asc" }),
  })
}

export function useSolicitudesDirectas(page: number) {
  return useQuery({
    queryKey: techKeys.directas(page),
    queryFn: () => servicesApi.solicitudesDirectas({ page, size: 12, sort: "fechaCreacion,desc" }),
  })
}

export function useAceptarDirecta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idServicio: string) => servicesApi.aceptarDirecta(idServicio),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directas"] })
      qc.invalidateQueries({ queryKey: ["mis-asignaciones"] })
      toast.success("¡Solicitud aceptada! El servicio ha sido asignado.")
    },
    onError: () => toast.error("No se pudo aceptar la solicitud"),
  })
}

export function useRechazarDirecta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idServicio: string) => servicesApi.rechazarDirecta(idServicio),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["directas"] })
      toast.success("Solicitud rechazada. El servicio ahora es público en el marketplace.")
    },
    onError: () => toast.error("No se pudo rechazar la solicitud"),
  })
}

export function useMisCotizaciones(idTec: string | undefined, page: number) {
  return useQuery({
    queryKey: techKeys.misCotizaciones(idTec ?? "", page),
    // size amplio: el historial se filtra/busca del lado del cliente (estado, texto).
    queryFn: () =>
      servicesApi.cotizacionesByTecnico(idTec!, { page, size: 50, sort: "fechaEnvio,desc" }),
    enabled: !!idTec,
  })
}

export function useMisAsignaciones(idTec: string | undefined, page: number) {
  return useQuery({
    queryKey: techKeys.misAsignaciones(idTec ?? "", page),
    queryFn: () => servicesApi.asignacionesByTecnico(idTec!, { page, size: 50 }),
    enabled: !!idTec,
  })
}

/**
 * Una asignación puntual del técnico (para la página de detalle). El backend no
 * expone un GET por idAsignacion, así que la buscamos en la lista del técnico;
 * funciona al refrescar la página, no solo navegando desde la lista.
 */
export function useMiAsignacion(idTec: string | undefined, idAsignacion: string | undefined) {
  return useQuery({
    queryKey: ["mi-asignacion", idTec, idAsignacion],
    enabled: !!idTec && !!idAsignacion,
    queryFn: async () => {
      const page = await servicesApi.asignacionesByTecnico(idTec!, { page: 0, size: 100 })
      return (page.content ?? []).find((a) => a.idAsignacion === idAsignacion) ?? null
    },
  })
}

/**
 * Nº de servicios (asignaciones) del técnico, para el perfil público. Tolera que
 * el rol que mira no tenga permiso de leer el conteo: en ese caso resuelve null
 * y el llamador cae a otro valor (sin lanzar el toast global de error).
 */
export function useTecnicoServiciosCount(idTec: string | undefined) {
  return useQuery({
    queryKey: ["tecnico-servicios-count", idTec],
    enabled: !!idTec,
    retry: false,
    staleTime: 60_000,
    queryFn: async (): Promise<number | null> => {
      try {
        return await apiGet<number>(`/api/v1/services/asignaciones/tecnico/${idTec}/count`, {
          skipErrorToast: true,
        })
      } catch {
        return null
      }
    },
  })
}

/** Set of service ids this technician has already quoted (to avoid duplicates). */
export function useServiciosCotizadosIds(idTec: string | undefined) {
  return useQuery({
    queryKey: ["mis-cotizaciones-ids", idTec],
    enabled: !!idTec,
    queryFn: async () => {
      const page = await servicesApi.cotizacionesByTecnico(idTec!, { page: 0, size: 100 })
      return new Set((page.content ?? []).map((c) => c.idServicio))
    },
  })
}

export function useCrearCotizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCotizacionRequest) => servicesApi.crearCotizacion(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disponibles"] })
      qc.invalidateQueries({ queryKey: ["mis-cotizaciones"] })
      qc.invalidateQueries({ queryKey: ["mis-cotizaciones-ids"] })
      toast.success("Cotización enviada")
    },
  })
}

export function useCancelarCotizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idCotizacion: string) => servicesApi.cancelarCotizacion(idCotizacion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-cotizaciones"] })
      qc.invalidateQueries({ queryKey: ["mis-cotizaciones-ids"] })
      qc.invalidateQueries({ queryKey: ["disponibles"] })
      toast.success("Cotización cancelada")
    },
  })
}

/** Invalida todo lo que depende del estado de una asignación/servicio. */
function invalidarAsignaciones(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["mis-asignaciones"] })
  qc.invalidateQueries({ queryKey: ["mi-asignacion"] })
  qc.invalidateQueries({ queryKey: ["servicio"] }) // detalle del servicio (estado)
  qc.invalidateQueries({ queryKey: ["servicios"] })
}

export function useIniciarAsignacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idAsignacion: string) => servicesApi.iniciarAsignacion(idAsignacion),
    onSuccess: () => {
      invalidarAsignaciones(qc)
      toast.success("Trabajo iniciado")
    },
  })
}

export function useFinalizarAsignacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idAsignacion: string) => servicesApi.finalizarAsignacion(idAsignacion),
    onSuccess: () => {
      invalidarAsignaciones(qc)
      toast.success("Trabajo finalizado")
    },
  })
}

export function useCrearEvidencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEvidenciaRequest) => servicesApi.crearEvidencia(body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["servicio", vars.idServicio] })
      qc.invalidateQueries({ queryKey: ["evidencias", vars.idServicio] })
    },
  })
}
