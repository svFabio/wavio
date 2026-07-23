import { apiClient } from '../../../lib/apiClient';
import type { ChatFlowStep, Servicio, HorarioNegocio, HorarioEspecial } from '../../../types';

export const configuracionApi = {
  // --- WhatsApp ---
  statusWhatsapp: async (): Promise<{ connected: boolean; phone?: string } | null> => {
    return apiClient.get<{ connected: boolean; phone?: string } | null>('/whatsapp/status');
  },

  guardarCredencialesWhatsApp: async (
    waAccessToken: string,
    waPhoneNumberId: string,
    waWabaId: string,
  ): Promise<{ success?: boolean; error?: string }> => {
    return apiClient.post<{ success?: boolean; error?: string }>('/whatsapp/save-credentials', {
      waAccessToken,
      waPhoneNumberId,
      waWabaId,
    });
  },

  desvincularWhatsApp: async (): Promise<{ success?: boolean; error?: string }> => {
    return apiClient.post<{ success?: boolean; error?: string }>('/whatsapp/disconnect');
  },

  // --- Configuración Bot ---
  getConfiguracion: async (): Promise<{
    id: number;
    trigger: string;
    mensajeBienvenida: string;
    mensajeConfirmacion: string;
    qrFotoUrl: string | null;
    cobrarAdelanto: boolean;
    porcentajeAdelanto: number;
    timezone: string;
    chatFlow: ChatFlowStep[];
  }> => {
    return apiClient.get<{
      id: number;
      trigger: string;
      mensajeBienvenida: string;
      mensajeConfirmacion: string;
      qrFotoUrl: string | null;
      cobrarAdelanto: boolean;
      porcentajeAdelanto: number;
      timezone: string;
      chatFlow: ChatFlowStep[];
    }>('/configuracion');
  },

  updateConfiguracion: async (data: {
    trigger?: string;
    mensajeBienvenida?: string;
    mensajeConfirmacion?: string;
    qrFotoUrl?: string | null;
    cobrarAdelanto?: boolean;
    porcentajeAdelanto?: number;
    timezone?: string;
    chatFlow?: ChatFlowStep[];
  }): Promise<unknown> => {
    return apiClient.patch('/configuracion', data);
  },

  uploadQR: async (imagen: string): Promise<{ qrFotoUrl: string }> => {
    return apiClient.post<{ qrFotoUrl: string }>('/configuracion/qr', { imagen });
  },

  configurarNegocio: async (nombre: string): Promise<unknown> => {
    return apiClient.patch('/negocio/configurar', { nombre });
  },

  // --- Servicios ---
  getServicios: async (): Promise<Servicio[]> => {
    return apiClient.get<Servicio[]>('/servicios');
  },

  createServicio: async (data: {
    nombre: string;
    categoria?: string;
    duracionMinutos: number;
    bufferMinutos: number;
    precio: number;
  }): Promise<Servicio> => {
    return apiClient.post<Servicio>('/servicios', data);
  },

  updateServicio: async (
    id: number,
    data: Partial<{
      nombre: string;
      categoria: string;
      duracionMinutos: number;
      bufferMinutos: number;
      precio: number;
      activo: boolean;
    }>,
  ): Promise<Servicio> => {
    return apiClient.patch<Servicio>(`/servicios/${id}`, data);
  },

  deleteServicio: async (id: number): Promise<unknown> => {
    return apiClient.delete(`/servicios/${id}`);
  },

  // --- Horarios Negocio ---
  getHorariosNegocio: async (): Promise<HorarioNegocio[]> => {
    return apiClient.get<HorarioNegocio[]>('/horarios');
  },

  updateHorariosNegocio: async (
    horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>,
  ): Promise<unknown> => {
    return apiClient.put('/horarios', { horarios });
  },

  // --- Horarios Especiales ---
  getHorariosEspeciales: async (): Promise<HorarioEspecial[]> => {
    return apiClient.get<HorarioEspecial[]>('/horarios/especiales');
  },

  createHorarioEspecial: async (data: {
    fecha: string;
    cerrado: boolean;
    horaInicio?: string | null;
    horaFin?: string | null;
  }): Promise<HorarioEspecial> => {
    return apiClient.post<HorarioEspecial>('/horarios/especiales', data);
  },

  deleteHorarioEspecial: async (id: number): Promise<unknown> => {
    return apiClient.delete(`/horarios/especiales/${id}`);
  },
};
