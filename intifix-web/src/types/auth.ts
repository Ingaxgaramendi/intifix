export type Role = "CLIENTE" | "TECNICO" | "ADMIN"

/** Payload returned by /auth/login, /auth/register and /auth/refresh. */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  correo: string
}

export interface LoginRequest {
  correo: string
  clave: string
}

export interface RegisterRequest {
  correo: string
  clave: string
  telefono: string
  dni: string
  roles: Role[]
}

export interface RefreshRequest {
  refreshToken: string
}

/** Shape of /auth/current-user. Extra fields tolerated; roles is what we route on. */
export interface CurrentUser {
  idUsuario?: string
  correo: string
  telefono?: string
  roles: Role[]
  [key: string]: unknown
}
