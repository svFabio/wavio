// auth.ts - Single source of truth for auth tokens
const TOKEN_KEY = 'token';
const ACTIVE_NEGOCIO_KEY = 'activeNegocioId';

export const auth = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getActiveNegocioId(): number | null {
    const raw = localStorage.getItem(ACTIVE_NEGOCIO_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return isNaN(id) ? null : id;
  },

  setActiveNegocioId(id: number): void {
    localStorage.setItem(ACTIVE_NEGOCIO_KEY, String(id));
  },

  clearActiveNegocioId(): void {
    localStorage.removeItem(ACTIVE_NEGOCIO_KEY);
  },
};
