import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { techniciansApi } from "@/api/technicians"
import type {
  CreateExcepcionRequest,
  CreateHorarioRequest,
  UpdateHorarioRequest,
} from "@/types/technician"

export const agendaKeys = {
  horarios: (idTec: string) => ["horarios", idTec] as const,
  excepciones: (idTec: string) => ["excepciones", idTec] as const,
}

/* ------------------------------- Horarios -------------------------------- */

export function useHorarios(idTecnico: string | undefined) {
  return useQuery({
    queryKey: agendaKeys.horarios(idTecnico ?? ""),
    queryFn: () => techniciansApi.horarios(idTecnico!),
    enabled: !!idTecnico,
    retry: false,
  })
}

export function useCrearHorario(idTecnico: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateHorarioRequest) => techniciansApi.crearHorario(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendaKeys.horarios(idTecnico) })
      toast.success("Horario añadido")
    },
  })
}

export function useActualizarHorario(idTecnico: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ idHorario, body }: { idHorario: string; body: UpdateHorarioRequest }) =>
      techniciansApi.actualizarHorario(idHorario, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendaKeys.horarios(idTecnico) })
    },
  })
}

export function useEliminarHorario(idTecnico: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idHorario: string) => techniciansApi.eliminarHorario(idHorario),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendaKeys.horarios(idTecnico) })
      toast.success("Horario eliminado")
    },
  })
}

/* ------------------------------ Excepciones ------------------------------ */

export function useExcepciones(idTecnico: string | undefined) {
  return useQuery({
    queryKey: agendaKeys.excepciones(idTecnico ?? ""),
    queryFn: () => techniciansApi.excepciones(idTecnico!),
    enabled: !!idTecnico,
    retry: false,
  })
}

export function useCrearExcepcion(idTecnico: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateExcepcionRequest) => techniciansApi.crearExcepcion(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendaKeys.excepciones(idTecnico) })
      toast.success("Excepción registrada")
    },
  })
}

export function useEliminarExcepcion(idTecnico: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idExcepcion: string) => techniciansApi.eliminarExcepcion(idExcepcion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agendaKeys.excepciones(idTecnico) })
      toast.success("Excepción eliminada")
    },
  })
}
