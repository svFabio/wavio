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

const loadFromStorage = (): Notification[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Notification[];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
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

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
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
    localStorage.removeItem(STORAGE_KEY);
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
