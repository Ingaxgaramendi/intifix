import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiGet } from "@/lib/axios"
import { servicesApi } from "@/api/services"
import { techniciansApi } from "@/api/technicians"
import { ubicacionesApi, type CreateUbicacionRequest } from "@/api/ubicaciones"
import { clientesApi } from "@/api/clientes"
import { tecnicoNombre, type Tecnico } from "@/types/technician"
import type { CreateServiceRequest, EstadoServicio, Servicio } from "@/types/service"

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

/** Map of idEspecialidad → nombre, built from the specialties catalog. */
export function useEspecialidadesMap() {
  const { data } = useSpecialties()
  return useMemo(() => {
    const m = new Map<string, string>()
    for (const e of data ?? []) m.set(e.idEspecialidad, e.nombre)
    return m
  }, [data])
}

// These resolvers are display-only enrichment: they must never surface a toast
// or break the UI if the current role can't read that resource (e.g. a técnico
// reading a cliente). On any error they resolve to null and the caller falls
// back to the service title.

/** Resolves a service's title from its id (cached). */
export function useServicioTitulo(idServicio?: string) {
  return useQuery({
    queryKey: ["servicio-titulo", idServicio],
    enabled: !!idServicio,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<string | null> => {
      try {
        const s = await apiGet<Servicio>(`/api/v1/services/${idServicio}/detalle`, {
          skipErrorToast: true,
        })
        return s.titulo ?? null
      } catch {
        return null
      }
    },
  })
}

/** Mini-perfil (nombre + foto) para avatares en chat, cotizaciones, etc. */
export interface PerfilMini {
  nombre: string | null
  foto: string | null
}

/** Técnico: nombre + foto desde su detalle público (cacheado). */
export function useTecnicoMini(idTec?: string) {
  return useQuery({
    queryKey: ["tecnico-mini", idTec],
    enabled: !!idTec,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<PerfilMini> => {
      try {
        const t = await apiGet<Tecnico>(`/api/v1/technicians/${idTec}/detalle`, { skipErrorToast: true })
        return { nombre: tecnicoNombre(t), foto: t.fotoPerfilUrl ?? null }
      } catch {
        return { nombre: null, foto: null }
      }
    },
  })
}

/** Cliente: nombre + foto desde su perfil público (cacheado). */
export function useClienteMini(idCliente?: string) {
  return useQuery({
    queryKey: ["cliente-mini", idCliente],
    enabled: !!idCliente,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<PerfilMini> => {
      try {
        const c = await clientesApi.perfilPublico(idCliente!)
        return { nombre: c.nombresCompletos ?? null, foto: c.fotoPerfilUrl ?? null }
      } catch {
        return { nombre: null, foto: null }
      }
    },
  })
}

/** Resolves a technician's display name from their id (cached). */
export function useTecnicoNombre(idTec?: string) {
  return useQuery({
    queryKey: ["tecnico-nombre", idTec],
    enabled: !!idTec,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<string | null> => {
      try {
        return tecnicoNombre(
          await apiGet<Tecnico>(`/api/v1/technicians/${idTec}/detalle`, { skipErrorToast: true }),
        )
      } catch {
        return null
      }
    },
  })
}

/**
 * Resolves a client's display name from their id (cached). Usa el perfil PÚBLICO
 * (`/clientes/{id}/perfil-publico`), que cualquier usuario autenticado puede leer
 * — a diferencia de `/clientes/{id}`, restringido al dueño/admin (un técnico daría
 * 403 y el chat se quedaba sin el nombre del cliente).
 */
export function useClienteNombre(idCliente?: string) {
  return useQuery({
    queryKey: ["cliente-nombre", idCliente],
    enabled: !!idCliente,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<string | null> => {
      try {
        const c = await clientesApi.perfilPublico(idCliente!)
        return c.nombresCompletos ?? null
      } catch {
        return null
      }
    },
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
  /** Ausente cuando la modalidad es EN_TALLER_TECNICO (sin ubicación del cliente). */
  ubicacion?: CreateUbicacionRequest
  servicio: Omit<CreateServiceRequest, "idUbicacion">
}

/** Crea la ubicación (si aplica) y luego el servicio; en taller va sin ubicación. */
export function useCrearServicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ubicacion, servicio }: CrearServicioInput) => {
      if (!ubicacion) {
        return servicesApi.create(servicio)
      }
      const ub = await ubicacionesApi.create(ubicacion)
      return servicesApi.create({ ...servicio, idUbicacion: ub.idUbicacion })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicios"] })
      toast.success("Servicio publicado")
    },
  })
}

export function useUpdateServicio(idServicio: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<CreateServiceRequest>) => servicesApi.update(idServicio, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.detail(idServicio) })
      qc.invalidateQueries({ queryKey: ["servicios"] })
      toast.success("Servicio actualizado")
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
