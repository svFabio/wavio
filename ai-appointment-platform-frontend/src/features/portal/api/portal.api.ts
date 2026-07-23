import { apiClient } from '../../../lib/apiClient';
import type { Cita } from '../../../types';

export const portalApi = {
  generateMagicLink: async (clienteId: number): Promise<{ url: string; token: string }> => {
    return apiClient.post<{ url: string; token: string }>(`/portal/generate/${clienteId}`);
  },

  validateMagicLink: async (
    token: string,
  ): Promise<{
    cliente: { id: number; nombre: string; telefono: string; email: string | null };
    negocio: { id: number; nombre: string };
  }> => {
    return apiClient.get<{
      cliente: { id: number; nombre: string; telefono: string; email: string | null };
      negocio: { id: number; nombre: string };
    }>(`/portal/${token}`);
  },

  getPortalAppointments: async (token: string): Promise<Cita[]> => {
    return apiClient.get<Cita[]>(`/portal/${token}/appointments`);
  },

  getPortalServices: async (
    token: string,
  ): Promise<Array<{ id: number; nombre: string; duracionMinutos: number; precio: number }>> => {
    return apiClient.get<
      Array<{ id: number; nombre: string; duracionMinutos: number; precio: number }>
    >(`/portal/${token}/services`);
  },

  getPortalAvailableSlots: async (
    token: string,
    fecha: string,
    servicioId?: number,
  ): Promise<string[]> => {
    let url = `/portal/${token}/available-slots?fecha=${encodeURIComponent(fecha)}`;
    if (servicioId) {
      url += `&servicioId=${servicioId}`;
    }
    return apiClient.get<string[]>(url);
  },

  bookPortalAppointment: async (
    token: string,
    data: { fecha: string; horario: string; servicioId?: number },
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/portal/${token}/book`, data);
  },
};
