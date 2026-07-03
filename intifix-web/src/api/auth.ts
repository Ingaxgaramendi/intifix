import { apiGet, apiPatch, apiPost } from "@/lib/axios"
import type {
  AuthTokens,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from "@/types/auth"

export const authApi = {
  login: (body: LoginRequest) => apiPost<AuthTokens>("/api/v1/auth/login", body),

  register: (body: RegisterRequest) => apiPost<AuthTokens>("/api/v1/auth/register", body),

  currentUser: () => apiGet<CurrentUser>("/api/v1/auth/current-user"),

  logout: (refreshToken: string) =>
    apiPost<void>("/api/v1/auth/logout", { refreshToken }),

  /** Actualiza el teléfono del usuario autenticado. Devuelve la sesión actualizada. */
  updateTelefono: (telefono: string) =>
    apiPatch<CurrentUser>("/api/v1/auth/me/telefono", { telefono }),

  /** Solicita un email de recuperación (siempre 200). */
  forgotPassword: (correo: string) =>
    apiPost<void>("/api/v1/auth/password/forgot", { correo }),

  /** Restablece la contraseña usando el token del email. */
  resetPassword: (token: string, nuevaPassword: string) =>
    apiPost<void>("/api/v1/auth/password/reset", { token, nuevaPassword }),

  /** Cambia la contraseña del usuario autenticado (requiere la actual). */
  cambiarPassword: (passwordActual: string, nuevaPassword: string) =>
    apiPatch<void>("/api/v1/auth/me/password", { passwordActual, nuevaPassword }),

  /** Envía un reclamo por suspensión/ban. Endpoint público — no requiere token. */
  apelar: (correo: string, mensaje: string) =>
    apiPost<void>("/api/v1/auth/apelar", { correo, mensaje }),
}
