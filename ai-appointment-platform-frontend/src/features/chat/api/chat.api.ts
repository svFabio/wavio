import { apiClient, ApiError } from '../../../lib/apiClient';
import type { Conversacion, MensajeChat } from '../../../types';

export const chatApi = {
  obtenerConversaciones: async (): Promise<Conversacion[]> => {
    const res = await apiClient.get<{ data: Conversacion[]; pagination: unknown }>(
      '/chat/conversaciones',
    );
    return res.data;
  },

  obtenerMensajes: async (jid: string): Promise<MensajeChat[]> => {
    const res = await apiClient.get<{ data: MensajeChat[]; pagination: unknown }>(
      `/chat/mensajes/${encodeURIComponent(jid)}`,
    );
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

  eliminarConversacion: async (jid: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.delete(`/chat/conversacion/${encodeURIComponent(jid)}`);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      return { success: false, error: 'Error de conexión' };
    }
  },
};
