import { apiClient } from '../../../lib/apiClient';
import type { Invitation, InvitationEstado, InvitationFormData } from '../types';

export const invitationsApi = {
  getInvitations: async (estado?: InvitationEstado): Promise<Invitation[]> => {
    const res = await apiClient.get<Invitation[]>(
      estado ? `/invitaciones?estado=${estado}` : '/invitaciones',
    );
    // GET /invitaciones returns a plain array (no { data, pagination } envelope)
    return res;
  },

  createInvitation: async (data: InvitationFormData): Promise<{ url: string }> => {
    return apiClient.post<{ url: string }>('/invitaciones', data);
  },

  resendInvitation: async (id: number): Promise<{ url: string; expiraEn: string }> => {
    return apiClient.post<{ url: string; expiraEn: string }>(`/invitaciones/${id}/reenviar`);
  },

  cancelInvitation: async (id: number): Promise<{ id: number; estado: InvitationEstado }> => {
    return apiClient.post<{ id: number; estado: InvitationEstado }>(`/invitaciones/${id}/cancelar`);
  },
};
