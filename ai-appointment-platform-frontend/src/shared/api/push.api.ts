import { apiClient } from '../../lib/apiClient';

export const pushApi = {
  getVapidPublicKey: async (): Promise<{ publicKey: string | null }> => {
    return apiClient.get<{ publicKey: string | null }>('/push/vapid-public-key');
  },

  subscribePush: async (subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<{ id: number }> => {
    return apiClient.post<{ id: number }>('/push/subscribe', subscription);
  },

  unsubscribePush: async (endpoint: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>('/push/unsubscribe', {
      body: JSON.stringify({ endpoint }),
    });
  },
};
