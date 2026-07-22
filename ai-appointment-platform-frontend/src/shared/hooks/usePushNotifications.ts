import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  isPushSupported,
  requestPushPermission,
  registerServiceWorker,
  subscribeToPush,
  sendSubscriptionToBackend,
  unsubscribeFromPush,
} from '../../lib/push';

async function checkPushEnabled(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export function usePushNotifications() {
  const queryClient = useQueryClient();
  const [supported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    isPushSupported() ? Notification.permission : 'denied',
  );

  const { data: pushEnabled = false } = useQuery<boolean>({
    queryKey: ['pushEnabled'],
    queryFn: checkPushEnabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!supported) return;
    const check = (): void => {
      setPermission(Notification.permission);
    };
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [supported]);

  const { data: vapidData } = useQuery({
    queryKey: ['vapidPublicKey'],
    queryFn: api.getVapidPublicKey,
    enabled: supported,
    staleTime: Infinity,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const perm = await requestPushPermission();
      setPermission(perm);
      if (perm !== 'granted') throw new Error('Permiso de notificaciones denegado');

      const publicKey = vapidData?.publicKey;
      if (!publicKey) throw new Error('VAPID keys no configuradas en el servidor');

      const subscription = await subscribeToPush(publicKey);
      if (!subscription) throw new Error('Error al suscribirse a notificaciones');

      await sendSubscriptionToBackend(subscription);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushEnabled'] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      await unsubscribeFromPush();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushEnabled'] });
    },
  });

  const toggle = useCallback(() => {
    if (pushEnabled) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  }, [pushEnabled, subscribeMutation, unsubscribeMutation]);

  const isPending = subscribeMutation.isPending || unsubscribeMutation.isPending;
  const error =
    (pushEnabled ? unsubscribeMutation.error : subscribeMutation.error)?.message ?? null;

  return {
    supported,
    permission,
    pushEnabled,
    isPending,
    error,
    toggle,
  };
}
