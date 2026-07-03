import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientesApi } from "@/api/clientes"
import { authApi } from "@/api/auth"
import { useAuthStore } from "@/stores/auth-store"
import type { UpdateClienteRequest } from "@/types/cliente"

export function useClienteProfile(idUsuario: string | undefined) {
  return useQuery({
    queryKey: ["cliente", idUsuario],
    queryFn: () => clientesApi.get(idUsuario!),
    enabled: !!idUsuario,
    retry: false,
  })
}

/** Perfil público del cliente que un técnico consulta (sin datos sensibles). */
export function useClientePerfilPublico(idUsuario: string | undefined) {
  return useQuery({
    queryKey: ["cliente-perfil-publico", idUsuario],
    queryFn: () => clientesApi.perfilPublico(idUsuario!),
    enabled: !!idUsuario,
  })
}

/** Fija/actualiza la ubicación base guardada del cliente. */
export function useUpdateClienteLocation(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idUbicacion: string) => clientesApi.updateLocation(idUsuario, idUbicacion),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cliente", idUsuario] })
      toast.success("Ubicación guardada")
    },
  })
}

export function useUpdateCliente(idUsuario: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateClienteRequest) => clientesApi.update(idUsuario, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cliente", idUsuario] })
      toast.success("Perfil actualizado")
    },
  })
}

export function useUpdateTelefono() {
  return useMutation({
    mutationFn: (telefono: string) => authApi.updateTelefono(telefono),
    onSuccess: (session) => {
      const { user, setUser } = useAuthStore.getState()
      if (user) setUser({ ...user, telefono: session.telefono })
      toast.success("Teléfono actualizado")
    },
  })
}
