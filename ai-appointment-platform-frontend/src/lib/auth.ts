// auth.ts - Single source of truth for auth tokens
const TOKEN_KEY = 'token';
const ACTIVE_NEGOCIO_KEY = 'activeNegocioId';

let inMemoryToken: string | null = null;
let inMemoryActiveNegocioId: number | null = null;

const getSafeStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
};

const logStorageError = (action: string, key: string, error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[auth] Storage error during ${action} for key "${key}":`, message);
};

export const auth = {
  getToken(): string | null {
    const storage = getSafeStorage();
    if (storage) {
      try {
        return storage.getItem(TOKEN_KEY);
      } catch (err) {
        logStorageError('getItem', TOKEN_KEY, err);
        return inMemoryToken;
      }
    }
    return inMemoryToken;
  },

  setToken(token: string): void {
    inMemoryToken = token;
    const storage = getSafeStorage();
    if (storage) {
      try {
        storage.setItem(TOKEN_KEY, token);
      } catch (err) {
        logStorageError('setItem', TOKEN_KEY, err);
      }
    }
  },

  clearToken(): void {
    inMemoryToken = null;
    const storage = getSafeStorage();
    if (storage) {
      try {
        storage.removeItem(TOKEN_KEY);
      } catch (err) {
        logStorageError('removeItem', TOKEN_KEY, err);
      }
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getActiveNegocioId(): number | null {
    const storage = getSafeStorage();
    if (storage) {
      try {
        const raw = storage.getItem(ACTIVE_NEGOCIO_KEY);
        if (!raw) return null;
        const id = Number(raw);
        return isNaN(id) ? null : id;
      } catch (err) {
        logStorageError('getItem', ACTIVE_NEGOCIO_KEY, err);
        return inMemoryActiveNegocioId;
      }
    }
    return inMemoryActiveNegocioId;
  },

  setActiveNegocioId(id: number): void {
    inMemoryActiveNegocioId = id;
    const storage = getSafeStorage();
    if (storage) {
      try {
        storage.setItem(ACTIVE_NEGOCIO_KEY, String(id));
      } catch (err) {
        logStorageError('setItem', ACTIVE_NEGOCIO_KEY, err);
      }
    }
  },

  clearActiveNegocioId(): void {
    inMemoryActiveNegocioId = null;
    const storage = getSafeStorage();
    if (storage) {
      try {
        storage.removeItem(ACTIVE_NEGOCIO_KEY);
      } catch (err) {
        logStorageError('removeItem', ACTIVE_NEGOCIO_KEY, err);
      }
    }
  },
};
