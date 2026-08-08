import { useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from './useNotifications';
import { useSocketEvent } from './useSocketEvent';
import { playNotificationSound } from '../../utils/notificationSound';

interface NuevaCitaPayload {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
}

/**
 * Listens for the 'nueva-cita' socket event and surfaces a toast notification
 * with a sound cue. Returns the current notification list and dismiss handler
 * so the caller can render the toasts.
 */
export function useNuevaCitaNotification() {
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const handleNuevaCita = useCallback(
    (data: NuevaCitaPayload) => {
      const fechaFormateada = format(new Date(data.fecha), 'dd MMM yyyy', { locale: es });
      addNotification({
        message: `Nueva cita de ${data.clienteNombre}`,
        clienteNombre: data.clienteNombre,
        fecha: fechaFormateada,
        horario: data.horario,
      });
      playNotificationSound();
    },
    [addNotification],
  );

  useSocketEvent('nueva-cita', handleNuevaCita);

  return { notifications, dismissNotification };
}
