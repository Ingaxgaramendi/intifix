import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthTokens, CurrentUser, Role } from "@/types/auth"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  correo: string | null
  user: CurrentUser | null
  /** Derived convenience flag. */
  isAuthenticated: boolean

  /** Store tokens after login / register / refresh. */
  setTokens: (tokens: AuthTokens) => void
  /** Store the resolved current user (with roles). */
  setUser: (user: CurrentUser | null) => void
  /** Wipe everything (logout / failed refresh). */
  clearSession: () => void
  /** Roles of the current user, or []. */
  roles: () => Role[]
  hasRole: (role: Role) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      correo: null,
      user: null,
      isAuthenticated: false,

      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          correo: tokens.correo,
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          correo: null,
          user: null,
          isAuthenticated: false,
        }),

      roles: () => get().user?.roles ?? [],
      hasRole: (role) => (get().user?.roles ?? []).includes(role),
    }),
    {
      name: "intifix-auth",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        correo: s.correo,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
)
