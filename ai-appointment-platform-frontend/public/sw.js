self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Wavio', body: 'Nueva notificación' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.ico',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
