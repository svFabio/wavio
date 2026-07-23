import { apiClient, ApiError } from '../../../lib/apiClient';
import type { Cita } from '../../../types';

export const citasApi = {
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
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error('Error al validar pago');
    }
  },

  obtenerHorariosDisponibles: async (fecha: string, servicioId?: number): Promise<string[]> => {
    let url = `/citas/horarios-disponibles?fecha=${encodeURIComponent(fecha)}`;
    if (servicioId) {
      url += `&servicioId=${servicioId}`;
    }
    const data = await apiClient.get<{ horarios?: string[] }>(url);
    return data.horarios ?? [];
  },

  crearCitaAdmin: async (datos: {
    clienteNombre: string;
    clienteTelefono: string;
    fecha: string;
    horario: string;
    servicioId?: number;
    staffId?: number;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/citas/admin', datos);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },

  obtenerResumen: async (): Promise<{
    totalHoy: number;
    pendientes: number;
    completadas: number;
    ingresos: number;
  }> => {
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
};
