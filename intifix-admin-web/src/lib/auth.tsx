/**
 * Authentication + authorization context.
 *
 * Logs in against the Django auth proxy, decodes the JWT to derive the
 * principal (admin id, roles → permissions), and exposes `can()` for
 * RBAC-driven UI. The backend re-validates every request regardless.
 */
import { jwtDecode } from "jwt-decode";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "./api";
import { type Permission, permissionsFor } from "./rbac";
import { tokenStore } from "./tokens";

// El backend (Spring) emite los claims como `sub` (id) y `correo` (email);
// dejamos `user_id`/`email` como fallback por compatibilidad.
interface JwtClaims {
  sub?: string | number;
  correo?: string;
  user_id?: string | number;
  roles?: string[];
  email?: string;
  exp?: number;
}

export interface Principal {
  id: string;
  email: string;
  roles: string[];
  permissions: Set<Permission>;
}

interface AuthContextValue {
  principal: Principal | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  canAny: (...permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function principalFromToken(access: string | null): Principal | null {
  if (!access) return null;
  try {
    const claims = jwtDecode<JwtClaims>(access);
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    const roles = claims.roles ?? [];
    return {
      id: String(claims.sub ?? claims.user_id ?? ""),
      email: claims.correo ?? claims.email ?? "",
      roles,
      permissions: permissionsFor(roles),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [principal, setPrincipal] = useState<Principal | null>(() =>
    principalFromToken(tokenStore.access),
  );
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/v1/auth/login/", { email, password });
      tokenStore.set({ access: data.access, refresh: data.refresh });
      setPrincipal(principalFromToken(data.access));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/v1/auth/logout/", { refresh: tokenStore.refresh });
    } catch {
      /* best-effort */
    }
    tokenStore.clear();
    setPrincipal(null);
  }, []);

  // Keep the principal in sync if another tab logs in/out.
  useEffect(() => {
    const sync = () => setPrincipal(principalFromToken(tokenStore.access));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      principal,
      loading,
      login,
      logout,
      can: (p) => principal?.permissions.has(p) ?? false,
      canAny: (...ps) => ps.some((p) => principal?.permissions.has(p) ?? false),
    }),
    [principal, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>.");
  return ctx;
}
