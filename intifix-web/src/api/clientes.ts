import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/axios"
import type {
  Cliente,
  ClientePerfilPublico,
  CreateClienteRequest,
  UpdateClienteRequest,
} from "@/types/cliente"

export const clientesApi = {
  get: (idUsuario: string) => apiGet<Cliente>(`/api/v1/clientes/${idUsuario}`),
  create: (body: CreateClienteRequest) => apiPost<Cliente>("/api/v1/clientes", body),
  update: (idUsuario: string, body: UpdateClienteRequest) =>
    apiPatch<Cliente>(`/api/v1/clientes/${idUsuario}`, body),

  // ⚠️ La ubicación se pasa por QUERY PARAM, no en el body (igual que técnicos).
  updateLocation: (idUsuario: string, idUbicacion: string) =>
    apiPut<Cliente>(`/api/v1/clientes/${idUsuario}/location`, undefined, {
      params: { idUbicacion },
    }),

  /** Perfil público para técnicos (sin DNI ni dirección exacta). */
  perfilPublico: (idUsuario: string) =>
    apiGet<ClientePerfilPublico>(`/api/v1/clientes/${idUsuario}/perfil-publico`),
}
