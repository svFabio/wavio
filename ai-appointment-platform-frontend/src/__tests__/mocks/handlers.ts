import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth
  http.get('*/api/v1/auth/me', () => {
    return HttpResponse.json({
      usuario: { id: 1, nombre: 'Admin Test', email: 'admin@wavio.com', rol: 'ADMIN' },
      negocios: [{ id: 1, nombre: 'Negocio Test', plan: 'PRO' }],
    });
  }),

  // Citas
  http.get('*/api/v1/citas', () => {
    return HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  // Clientes
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  // Chat
  http.get('*/api/v1/chat', () => {
    return HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  // Configuracion
  http.get('*/api/v1/configuracion', () => {
    return HttpResponse.json({
      horarios: [],
      servicios: [],
    });
  }),

  // Users
  http.get('*/api/v1/usuarios', () => {
    return HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  // Waitlist
  http.get('*/api/v1/waitlist', () => {
    return HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  // Statistics
  http.get('*/api/v1/statistics', () => {
    return HttpResponse.json({
      totalCitas: 0,
      totalClientes: 0,
    });
  }),

  // Pagos
  http.get('*/api/v1/pagos', () => {
    return HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });
  }),

  // Push
  http.post('*/api/v1/push/subscribe', () => {
    return HttpResponse.json({ success: true });
  }),
];
