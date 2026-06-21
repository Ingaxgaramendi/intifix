export interface Cliente {
  idUsuario: string
  nombresCompletos?: string
  dniRuc?: string
  fotoPerfilUrl?: string
  correo?: string
  telefono?: string
  [key: string]: unknown
}

/** PATCH /api/v1/clientes/{idUsuario} — send only changed fields. */
export interface UpdateClienteRequest {
  nombresCompletos?: string
  dniRuc?: string
  fotoPerfilUrl?: string
}

/** POST /api/v1/clientes — first-time profile creation. */
export interface CreateClienteRequest {
  idUsuario: string
  nombresCompletos: string
  dniRuc?: string
  fotoPerfilUrl?: string
}
