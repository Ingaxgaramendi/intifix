import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { techniciansApi } from "@/api/technicians"
import { ubicacionesApi, type CreateUbicacionRequest } from "@/api/ubicaciones"
import type {
  Disponibilidad,
  UpdateDocumentosRequest,
  UpdateTecnicoRequest,
} from "@/types/technician"

export function useTecnicoProfile(idUsuario: string | undefined) {
  return useQuery({
    queryKey: ["tecnico-perfil", idUsuario],
    queryFn: () => techniciansApi.detalle(idUsuario!),
    enabled: !!idUsuario,
    retry: false,
  })
}

export function useUpdateTecnico(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateTecnicoRequest) => techniciansApi.update(idUsuario, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnico-perfil", idUsuario] })
      toast.success("Perfil actualizado")
    },
  })
}

export function useUpdateDocumentos(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateDocumentosRequest) => techniciansApi.updateDocumentos(idUsuario, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnico-perfil", idUsuario] })
      toast.success("Documentos actualizados")
    },
  })
}

export function useUpdateDisponibilidad(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (disponibilidad: Disponibilidad) =>
      techniciansApi.updateDisponibilidad(idUsuario, disponibilidad),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnico-perfil", idUsuario] })
      toast.success("Disponibilidad actualizada")
    },
  })
}

/** Catálogo completo de especialidades disponibles en el sistema. */
export function useEspecialidadesCatalogo() {
  return useQuery({
    queryKey: ["especialidades-catalogo"],
    queryFn: () => techniciansApi.specialties(),
    staleTime: 1000 * 60 * 10,
  })
}

/** Especialidades asignadas al técnico. */
export function useMisEspecialidades(idUsuario: string | undefined) {
  return useQuery({
    queryKey: ["tecnico-especialidades", idUsuario],
    queryFn: () => techniciansApi.misEspecialidades(idUsuario!),
    enabled: !!idUsuario,
    retry: false,
  })
}

export function useAsignarEspecialidad(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idEspecialidad: string) =>
      techniciansApi.asignarEspecialidad(idUsuario, idEspecialidad),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnico-especialidades", idUsuario] })
      toast.success("Especialidad añadida")
    },
    onError: () => toast.error("No se pudo añadir la especialidad"),
  })
}

export function useRemoverEspecialidad(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idEspecialidad: string) =>
      techniciansApi.removerEspecialidad(idUsuario, idEspecialidad),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnico-especialidades", idUsuario] })
      toast.success("Especialidad removida")
    },
    onError: () => toast.error("No se pudo remover la especialidad"),
  })
}

export function useActualizarCertificadoEspecialidad(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ idEspecialidad, url }: { idEspecialidad: string; url: string }) =>
      techniciansApi.actualizarCertificadoEspecialidad(idUsuario, idEspecialidad, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnico-especialidades", idUsuario] })
      toast.success("Certificado actualizado")
    },
    onError: () => toast.error("No se pudo actualizar el certificado"),
  })
}

/** Creates the location point, then assigns it to the technician (query param). */
export function useUpdateLocation(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ubicacion: CreateUbicacionRequest) => {
      const ub = await ubicacionesApi.create(ubicacion)
      return techniciansApi.updateLocation(idUsuario, ub.idUbicacion)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnico-perfil", idUsuario] })
      toast.success("Ubicación actualizada")
    },
  })
}
