/**
 * Token storage.
 *
 * Tokens live in localStorage so the session survives reloads. The access token
 * is short-lived (the backend default is 15 min) and rotated via the refresh
 * token. Note: localStorage is readable by JS, so keep the app XSS-clean; for
 * stricter setups move refresh tokens to an httpOnly cookie on the API side.
 */
const ACCESS_KEY = "intifix.access";
const REFRESH_KEY = "intifix.refresh";

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
