import { apiGet, apiPatch, apiPost } from "@/lib/axios"
import type { Cliente, CreateClienteRequest, UpdateClienteRequest } from "@/types/cliente"

export const clientesApi = {
  get: (idUsuario: string) => apiGet<Cliente>(`/api/v1/clientes/${idUsuario}`),
  create: (body: CreateClienteRequest) => apiPost<Cliente>("/api/v1/clientes", body),
  update: (idUsuario: string, body: UpdateClienteRequest) =>
    apiPatch<Cliente>(`/api/v1/clientes/${idUsuario}`, body),
}
