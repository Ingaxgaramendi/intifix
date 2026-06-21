import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { servicesApi } from "@/api/services"
import type { CreateCotizacionRequest, CreateEvidenciaRequest } from "@/types/service"

export const techKeys = {
  disponibles: (page: number) => ["disponibles", page] as const,
  misCotizaciones: (idTec: string, page: number) => ["mis-cotizaciones", idTec, page] as const,
  misAsignaciones: (idTec: string, page: number) => ["mis-asignaciones", idTec, page] as const,
}

export function useServiciosDisponibles(page: number) {
  return useQuery({
    queryKey: techKeys.disponibles(page),
    queryFn: () => servicesApi.disponibles({ page, size: 12, sort: "fechaProgramada,asc" }),
  })
}

export function useMisCotizaciones(idTec: string | undefined, page: number) {
  return useQuery({
    queryKey: techKeys.misCotizaciones(idTec ?? "", page),
    queryFn: () =>
      servicesApi.cotizacionesByTecnico(idTec!, { page, size: 12, sort: "fechaCreacion,desc" }),
    enabled: !!idTec,
  })
}

export function useMisAsignaciones(idTec: string | undefined, page: number) {
  return useQuery({
    queryKey: techKeys.misAsignaciones(idTec ?? "", page),
    queryFn: () => servicesApi.asignacionesByTecnico(idTec!, { page, size: 12 }),
    enabled: !!idTec,
  })
}

export function useCrearCotizacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCotizacionRequest) => servicesApi.crearCotizacion(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disponibles"] })
      qc.invalidateQueries({ queryKey: ["mis-cotizaciones"] })
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
      toast.success("Cotización cancelada")
    },
  })
}

export function useIniciarAsignacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idAsignacion: string) => servicesApi.iniciarAsignacion(idAsignacion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-asignaciones"] })
      toast.success("Trabajo iniciado")
    },
  })
}

export function useFinalizarAsignacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idAsignacion: string) => servicesApi.finalizarAsignacion(idAsignacion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mis-asignaciones"] })
      toast.success("Trabajo finalizado")
    },
  })
}

export function useCrearEvidencia() {
  return useMutation({
    mutationFn: (body: CreateEvidenciaRequest) => servicesApi.crearEvidencia(body),
    onSuccess: () => toast.success("Evidencia subida"),
  })
}
