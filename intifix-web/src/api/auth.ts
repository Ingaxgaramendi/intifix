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
}
