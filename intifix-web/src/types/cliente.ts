export interface Cliente {
  idUsuario: string
  nombresCompletos?: string
  dniRuc?: string
  fotoPerfilUrl?: string
  /** Ubicación base guardada del cliente (para "técnicos más cercanos"). */
  idUbicacion?: string
  correo?: string
  telefono?: string
  [key: string]: unknown
}

/**
 * Vista pública del cliente que ve un técnico (GET /clientes/{id}/perfil-publico).
 * Sin datos sensibles: solo distrito/zona, nunca la dirección exacta.
 */
export interface ClientePerfilPublico {
  idUsuario: string
  nombresCompletos?: string
  fotoPerfilUrl?: string
  creadoEn?: string
  distrito?: string
  provincia?: string
  latitud?: number
  longitud?: number
  totalServicios?: number
  tieneUbicacion?: boolean
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
