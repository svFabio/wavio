import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  message: string;
  clienteNombre: string;
  fecha: string;
  horario: string;
  timestamp: number;
}

const STORAGE_KEY = 'citas-notifications';

const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[useNotifications] Unable to access sessionStorage:', message);
    return null;
  }
};

const clearLegacyLocalStorage = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem(STORAGE_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[useNotifications] Unable to clear legacy localStorage:', message);
  }
};

const loadFromStorage = (): Notification[] => {
  clearLegacyLocalStorage();

  try {
    const storage = getSessionStorage();
    if (!storage) return [];
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Notification[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[useNotifications] Failed to load notifications from storage:', message);
    try {
      getSessionStorage()?.removeItem(STORAGE_KEY);
    } catch (clearErr) {
      const clearMessage = clearErr instanceof Error ? clearErr.message : String(clearErr);
      console.warn('[useNotifications] Failed to reset storage after parse error:', clearMessage);
    }
    return [];
  }
};

export interface UseNotificationsReturn {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>(loadFromStorage);

  // Persist to session storage whenever notifications change
  useEffect(() => {
    try {
      const storage = getSessionStorage();
      if (!storage) return;
      if (notifications.length === 0) {
        storage.removeItem(STORAGE_KEY);
      } else {
        storage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[useNotifications] Failed to save notifications to storage:', message);
    }
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification.id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try {
      const storage = getSessionStorage();
      storage?.removeItem(STORAGE_KEY);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[useNotifications] Failed to clear notifications from storage:', message);
    }
  }, []);

  const showNotification = useCallback(
    (message: string, _type?: 'success' | 'error' | 'info') => {
      addNotification({
        message,
        clienteNombre: '',
        fecha: '',
        horario: '',
      });
    },
    [addNotification],
  );

  return {
    notifications,
    addNotification,
    showNotification,
    dismissNotification,
    clearAll,
  };
};
