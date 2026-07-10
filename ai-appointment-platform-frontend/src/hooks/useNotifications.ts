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

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Cargar notificaciones de localStorage al montar
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
            } catch (error) {
                console.error('Error parsing notifications:', error);
            }
        }
    }, []);

    // Guardar notificaciones en localStorage cuando cambian
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random()}`,
            timestamp: Date.now()
        };
        setNotifications(prev => [newNotification, ...prev]);
        return newNotification.id;
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        notifications,
        addNotification,
        dismissNotification,
        clearAll
    };
};
