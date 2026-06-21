import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { servicesApi } from "@/api/services"
import { techniciansApi } from "@/api/technicians"
import { ubicacionesApi, type CreateUbicacionRequest } from "@/api/ubicaciones"
import type { CreateServiceRequest, EstadoServicio } from "@/types/service"

export const serviceKeys = {
  list: (idCliente: string, page: number) => ["servicios", idCliente, page] as const,
  detail: (id: string) => ["servicio", id] as const,
  cotizaciones: (id: string) => ["cotizaciones", id] as const,
  asignaciones: (id: string) => ["asignaciones", id] as const,
  evidencias: (id: string) => ["evidencias", id] as const,
}

export function useSpecialties() {
  return useQuery({
    queryKey: ["specialties"],
    queryFn: techniciansApi.specialties,
    staleTime: 10 * 60_000,
  })
}

export function useMisServicios(idCliente: string | undefined, page: number) {
  return useQuery({
    queryKey: serviceKeys.list(idCliente ?? "", page),
    queryFn: () => servicesApi.byCliente(idCliente!, { page, size: 12, sort: "fechaCreacion,desc" }),
    enabled: !!idCliente,
  })
}

export function useServicioDetalle(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => servicesApi.detalle(id),
    enabled: !!id,
  })
}

/** Follow-up fetch for a service's address (detalle only carries idUbicacion). */
export function useUbicacion(idUbicacion?: string) {
  return useQuery({
    queryKey: ["ubicacion", idUbicacion],
    queryFn: () => ubicacionesApi.get(idUbicacion!),
    enabled: !!idUbicacion,
    staleTime: 5 * 60_000,
  })
}

export function useCotizaciones(id: string) {
  return useQuery({
    queryKey: serviceKeys.cotizaciones(id),
    queryFn: () => servicesApi.cotizacionesOrdenadas(id),
    enabled: !!id,
  })
}

export function useAsignaciones(id: string) {
  return useQuery({
    queryKey: serviceKeys.asignaciones(id),
    queryFn: () => servicesApi.asignacionesByServicio(id),
    enabled: !!id,
  })
}

export function useEvidencias(id: string) {
  return useQuery({
    queryKey: serviceKeys.evidencias(id),
    queryFn: () => servicesApi.evidenciasByServicio(id),
    enabled: !!id,
  })
}

export interface CrearServicioInput {
  ubicacion: CreateUbicacionRequest
  servicio: Omit<CreateServiceRequest, "idUbicacion">
}

/** Creates the location point first, then the service with its idUbicacion. */
export function useCrearServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ubicacion, servicio }: CrearServicioInput) => {
      const ub = await ubicacionesApi.create(ubicacion)
      return servicesApi.create({ ...servicio, idUbicacion: ub.idUbicacion })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicios"] })
      toast.success("Servicio publicado")
    },
  })
}

export function useChangeEstado(idServicio: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ estado, comentario }: { estado: EstadoServicio; comentario?: string }) =>
      servicesApi.changeEstado(idServicio, estado, comentario),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.detail(idServicio) })
      qc.invalidateQueries({ queryKey: ["servicios"] })
      toast.success("Estado actualizado")
    },
  })
}

export function useDeleteServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idServicio: string) => servicesApi.remove(idServicio),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicios"] })
      toast.success("Servicio eliminado")
    },
  })
}

/** Accept a quote (estado ACEPTADA) and assign its technician in one action. */
export function useAceptarCotizacion(idServicio: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      idCotizacion,
      idUsuarioTecnico,
    }: {
      idCotizacion: string
      idUsuarioTecnico?: string
    }) => {
      await servicesApi.responderCotizacion(idCotizacion, "ACEPTADA")
      if (idUsuarioTecnico) {
        await servicesApi.asignarTecnico(idServicio, idUsuarioTecnico, idCotizacion)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.cotizaciones(idServicio) })
      qc.invalidateQueries({ queryKey: serviceKeys.asignaciones(idServicio) })
      qc.invalidateQueries({ queryKey: serviceKeys.detail(idServicio) })
      toast.success("Cotización aceptada y técnico asignado")
    },
  })
}

export function useRechazarCotizacion(idServicio: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idCotizacion: string) =>
      servicesApi.responderCotizacion(idCotizacion, "RECHAZADA"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.detail(idServicio) })
      toast.success("Cotización rechazada")
    },
  })
}
