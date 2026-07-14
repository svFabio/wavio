import type { Cita } from '../types';
import { apiClient, ApiError } from '../lib/apiClient';

export const api = {
  // --- AUTENTICACIÓN ---
  loginConGoogle: async (googleToken: string) => {
    return apiClient.post<{
      token: string;
      usuario: { id: number; nombre: string; email: string; rol: 'ADMIN' | 'STAFF'; fotoPerfil?: string };
      negocio: { id: number; nombre: string; plan: 'FREE' | 'PRO' } | null;
      esNuevo?: boolean;
    }>('/auth/google', {
      googleToken,
    });
  },

  register: async (email: string, password: string) => {
    try {
      return await apiClient.post<{
        token: string;
        usuario: { id: number; nombre: string; email: string; rol: 'ADMIN' | 'STAFF'; fotoPerfil?: string };
        negocio: { id: number; nombre: string; plan: 'FREE' | 'PRO' } | null;
        esNuevo?: boolean;
      }>(
        '/auth/register',
        { email, password },
      );
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error('Error al registrarse');
    }
  },

  login: async (email: string, password: string) => {
    try {
      return await apiClient.post<{
        token: string;
        usuario: { id: number; nombre: string; email: string; rol: 'ADMIN' | 'STAFF'; fotoPerfil?: string };
        negocio: { id: number; nombre: string; plan: 'FREE' | 'PRO' } | null;
        esNuevo?: boolean;
      }>(
        '/auth/login',
        { email, password },
      );
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error('Credenciales incorrectas');
    }
  },

  me: async (token: string) => {
    try {
      return await apiClient.get<{
        usuario: {
          id: number;
          nombre: string;
          email: string;
          rol: 'ADMIN' | 'STAFF';
          fotoPerfil?: string;
        };
        negocio: { id: number; nombre: string; plan: 'FREE' | 'PRO' } | null;
      }>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      return null;
    }
  },

  updateAvatar: async (base64Image: string) => {
    return apiClient.put<{ url: string }>('/auth/me/avatar', { image: base64Image });
  },

  deleteAvatar: async () => {
    return apiClient.delete<{ success: boolean }>('/auth/me/avatar');
  },

  updateNombre: async (nombre: string) => {
    return apiClient.patch<{ nombre: string }>('/auth/me/nombre', { nombre });
  },

  // --- CITAS ---
  obtenerCitas: async (fecha?: string): Promise<Cita[]> => {
    const url = fecha ? `/citas?fecha=${encodeURIComponent(fecha)}` : '/citas';
    const res = await apiClient.get<{ data: Cita[]; pagination: unknown }>(url);
    return res.data;
  },

  obtenerPendientes: async (): Promise<Cita[]> => {
    const res = await apiClient.get<{ data: Cita[]; pagination: unknown }>('/citas/pendientes');
    return res.data;
  },

  validarPago: async (id: string, accion: 'APROBAR' | 'RECHAZAR'): Promise<boolean> => {
    try {
      await apiClient.post(`/citas/${id}/validar`, { accion });
      return true;
    } catch {
      return false;
    }
  },

  obtenerHorariosDisponibles: async (fecha: string): Promise<string[]> => {
    const data = await apiClient.get<{ horarios?: string[] }>(
      `/citas/horarios-disponibles?fecha=${encodeURIComponent(fecha)}`,
    );
    return data.horarios || [];
  },

  crearCitaAdmin: async (datos: {
    clienteNombre: string;
    clienteTelefono: string;
    fecha: string;
    horario: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/citas/admin', datos);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },

  obtenerResumen: async () => {
    return apiClient.get<{
      totalHoy: number;
      pendientes: number;
      completadas: number;
      ingresos: number;
    }>('/citas/resumen');
  },

  reprogramarCita: async (
    id: string,
    fecha: string,
    horario: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.put(`/citas/${id}/reprogramar`, { fecha, horario });
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },

  marcarNoAsistio: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.put(`/citas/${id}/no-asistio`);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },

  marcarAsistio: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.put(`/citas/${id}/asistio`);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },

  actualizarDescripcion: async (
    id: string,
    descripcion: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.put(`/citas/${id}/descripcion`, { descripcion });
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },

  // --- CHAT ---
  obtenerConversaciones: async () => {
    const res = await apiClient.get<{
      data: import('../types').Conversacion[];
      pagination: unknown;
    }>('/chat/conversaciones');
    return res.data;
  },

  obtenerMensajes: async (jid: string) => {
    const res = await apiClient.get<{
      data: import('../types').MensajeChat[];
      pagination: unknown;
    }>(`/chat/mensajes/${encodeURIComponent(jid)}`);
    return res.data;
  },

  enviarMensajeChat: async (
    jid: string,
    texto: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post(`/chat/enviar/${encodeURIComponent(jid)}`, { texto });
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },

  eliminarConversacion: async (jid: string): Promise<{ success: boolean }> => {
    try {
      await apiClient.delete(`/chat/conversacion/${encodeURIComponent(jid)}`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  // --- WHATSAPP META CLOUD API ---
  statusWhatsapp: async () => {
    return apiClient.get<{ connected: boolean; phone?: string } | null>('/whatsapp/status');
  },

  guardarCredencialesWhatsApp: async (
    waAccessToken: string,
    waPhoneNumberId: string,
    waWabaId: string,
  ) => {
    return apiClient.post<{ success?: boolean; error?: string }>('/whatsapp/save-credentials', {
      waAccessToken,
      waPhoneNumberId,
      waWabaId,
    });
  },

  desvincularWhatsApp: async () => {
    return apiClient.post<{ success?: boolean; error?: string }>('/whatsapp/disconnect');
  },

  // --- CONFIGURACION BOT ---
  getConfiguracion: async () => {
    return apiClient.get<{
      id: number;
      trigger: string;
      mensajeBienvenida: string;
      mensajeConfirmacion: string;
      servicios: { nombre: string; precio: number }[];
      horarios: Record<string, string[]>;
      cobrarAdelanto: boolean;
      porcentajeAdelanto: number;
    }>('/configuracion');
  },

  updateConfiguracion: async (data: {
    trigger?: string;
    mensajeBienvenida?: string;
    mensajeConfirmacion?: string;
    servicios?: { nombre: string; precio: number }[];
    horarios?: Record<string, string[]>;
    cobrarAdelanto?: boolean;
    porcentajeAdelanto?: number;
  }) => {
    return apiClient.patch('/configuracion', data);
  },

  // --- STATISTICS ---
  getStatisticsOverview: async () => {
    return apiClient.get<{
      citasMes: number;
      ingresosMes: number;
      topClientes: Array<{ nombre: string; telefono: string; totalCitas: number }>;
      horariosPopulares: Array<{ horario: string; totalReservas: number }>;
      citasVirtuales: number;
      citasPresenciales: number;
      ratingPromedio?: number;
    }>('/statistics/overview');
  },

  getStatisticsRevenue: async (months: number = 6) => {
    return apiClient.get<{ revenue: Array<{ mes: string; total: number }> }>(
      `/statistics/revenue?months=${months}`,
    );
  },

  // --- USERS ---
  getUsers: async () => {
    const res = await apiClient.get<{
      data: Array<{
        id: number;
        nombre: string;
        email: string;
        rol: 'ADMIN' | 'STAFF';
        creadoEn: string;
      }>;
      pagination: unknown;
    }>('/users');
    return res.data;
  },

  createUser: async (data: {
    nombre: string;
    email: string;
    password: string;
    rol: 'ADMIN' | 'STAFF';
  }) => {
    return apiClient.post('/users', data);
  },

  updateUser: async (
    id: number,
    data: { nombre: string; email: string; password: string; rol: 'ADMIN' | 'STAFF' },
  ) => {
    return apiClient.put(`/users/${id}`, data);
  },

  deleteUser: async (id: number) => {
    return apiClient.delete(`/users/${id}`);
  },

  // --- NEGOCIO ---
  configurarNegocio: async (nombre: string) => {
    return apiClient.patch('/negocio/configurar', { nombre });
  },
};
