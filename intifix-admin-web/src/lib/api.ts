/**
 * Axios API client.
 *
 * - Attaches the bearer access token to every request.
 * - On a 401, transparently refreshes the access token once (single-flight,
 *   so concurrent 401s share one refresh) and replays the failed request.
 * - On refresh failure, clears the session and redirects to /login.
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { tokenStore } from "./tokens";

const baseURL = import.meta.env.VITE_API_URL || "";

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.refresh;
  if (!refresh) return null;
  try {
    const { data } = await axios.post(`${baseURL}/api/v1/auth/refresh/`, { refresh });
    tokenStore.set({ access: data.access, refresh: data.refresh });
    return data.access as string;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthCall = original?.url?.includes("/api/v1/auth/");

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => (refreshing = null));
      const newAccess = await refreshing;
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      }
      tokenStore.clear();
      if (location.pathname !== "/login") location.assign("/login");
    }
    return Promise.reject(error);
  },
);

/** Normalize a DRF error envelope into a human message. */
export function apiErrorMessage(error: unknown): string {
  const err = error as AxiosError<any>;
  const data = err.response?.data;
  return (
    data?.error?.message ||
    data?.detail ||
    (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
    err.message ||
    "Ocurrió un error inesperado."
  );
}
