import { apiClient } from '../../../lib/apiClient';

type UserRecord = {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'STAFF';
  creadoEn: string;
};

export const usersApi = {
  getUsers: async (): Promise<UserRecord[]> => {
    const res = await apiClient.get<{ data: UserRecord[]; pagination: unknown }>('/users');
    return res.data;
  },

  createUser: async (data: {
    nombre: string;
    email: string;
    password: string;
    rol: 'ADMIN' | 'STAFF';
  }): Promise<unknown> => {
    return apiClient.post('/users', data);
  },

  updateUser: async (
    id: number,
    data: { nombre: string; email: string; password: string; rol: 'ADMIN' | 'STAFF' },
  ): Promise<unknown> => {
    return apiClient.put(`/users/${id}`, data);
  },

  deleteUser: async (id: number): Promise<unknown> => {
    return apiClient.delete(`/users/${id}`);
  },
};
