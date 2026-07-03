/**
 * Token storage.
 *
 * Tokens live in localStorage so the session survives reloads. The access token
 * is short-lived (the backend default is 15 min) and rotated via the refresh
 * token. Note: localStorage is readable by JS, so keep the app XSS-clean; for
 * stricter setups move refresh tokens to an httpOnly cookie on the API side.
 */
// v2: las claves cambiaron a propósito para descartar tokens de sesiones viejas
// (firmados con otro secreto) que provocaban "token inválido o expirado" al recargar.
const ACCESS_KEY = "intifix.admin.v2.access";
const REFRESH_KEY = "intifix.admin.v2.refresh";

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ access, refresh }: { access?: string; refresh?: string }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
