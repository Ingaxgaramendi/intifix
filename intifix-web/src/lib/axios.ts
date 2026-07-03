import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import type { ApiResponse } from "@/types/api"
import type { AuthTokens } from "@/types/auth"

// Opt-in flag to suppress the automatic error toast for an expected/benign error.
declare module "axios" {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

/** Main instance. Use the typed helpers below rather than this directly. */
export const http = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

/* ----------------------------- Request: attach token --------------------- */

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.set("Authorization", `Bearer ${token}`)
  return config
})

/* --------------------- Response: 401 refresh + error toast --------------- */

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Single-flight refresh so concurrent 401s share one refresh round-trip.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clearSession } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    // Bare axios (not `http`) to avoid the interceptor recursing.
    const res = await axios.post<ApiResponse<AuthTokens>>(
      `${BASE_URL}/api/v1/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    )
    const tokens = res.data.data
    setTokens(tokens)
    return tokens.accessToken
  } catch {
    clearSession()
    return null
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthCall = original?.url?.includes("/auth/")

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`)
        return http(original)
      }
      // Refresh failed: bounce to login.
      if (typeof window !== "undefined") window.location.assign("/login")
      return Promise.reject(error)
    }

    // Surface the backend message; skip noisy toasts for the silent auth probe,
    // calls that opted out, and blocked-account codes (they show their own UI).
    const message = error.response?.data?.message ?? error.message ?? "Error de red"
    const errorCode = (error.response?.data as Record<string, unknown> | undefined)?.errorCode as string | undefined
    const isAccountBlocked = errorCode === "ACCOUNT_SUSPENDED" || errorCode === "ACCOUNT_BANNED"
    if ((!isAuthCall || status !== 401) && !original?.skipErrorToast && !isAccountBlocked) {
      toast.error(message)
    }
    return Promise.reject(error)
  },
)

/* ------------------------- Typed helpers (unwrap data) ------------------- */
// Always return `response.data.data` so call sites get just the payload.

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.get<ApiResponse<T>>(url, config)
  return res.data.data
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.post<ApiResponse<T>>(url, body, config)
  return res.data.data
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.put<ApiResponse<T>>(url, body, config)
  return res.data.data
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.patch<ApiResponse<T>>(url, body, config)
  return res.data.data
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.delete<ApiResponse<T>>(url, config)
  return res.data.data
}
