import { apiClient } from '../../../lib/apiClient';
import type { WaitlistEntry, AddToWaitlistPayload } from '../types';

export const waitlistApi = {
  getWaitlist: async (): Promise<WaitlistEntry[]> => {
    return apiClient.get<WaitlistEntry[]>('/waitlist');
  },

  addToWaitlist: async (data: AddToWaitlistPayload): Promise<WaitlistEntry> => {
    return apiClient.post<WaitlistEntry>('/waitlist', data);
  },

  removeFromWaitlist: async (id: number): Promise<unknown> => {
    return apiClient.delete(`/waitlist/${id}`);
  },

  notifyWaitlist: async (id: number): Promise<unknown> => {
    return apiClient.post(`/waitlist/${id}/notify`);
  },
};
