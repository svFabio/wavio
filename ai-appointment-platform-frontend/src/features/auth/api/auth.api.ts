import { apiClient, ApiError } from '../../../lib/apiClient';

type AuthResponse = {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'STAFF';
    fotoPerfil?: string;
  };
  negocios: Array<{ id: number; nombre: string; plan: 'FREE' | 'PRO' }>;
  esNuevo?: boolean;
};

export const authApi = {
  loginConGoogle: async (googleToken: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/google', { googleToken });
  },

  register: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>('/auth/register', { email, password });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error('Error al registrarse');
    }
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>('/auth/login', { email, password });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new Error('Credenciales incorrectas');
    }
  },

  me: async (): Promise<{
    usuario: {
      id: number;
      nombre: string;
      email: string;
      rol: 'ADMIN' | 'STAFF';
      fotoPerfil?: string;
    };
    negocios: Array<{ id: number; nombre: string; plan: 'FREE' | 'PRO' }>;
  } | null> => {
    try {
      return await apiClient.get<{
        usuario: {
          id: number;
          nombre: string;
          email: string;
          rol: 'ADMIN' | 'STAFF';
          fotoPerfil?: string;
        };
        negocios: Array<{ id: number; nombre: string; plan: 'FREE' | 'PRO' }>;
      }>('/auth/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return null;
      }
      throw err;
    }
  },

  updateAvatar: async (base64Image: string): Promise<{ url: string }> => {
    return apiClient.put<{ url: string }>('/auth/me/avatar', { image: base64Image });
  },

  deleteAvatar: async (): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>('/auth/me/avatar');
  },

  updateNombre: async (nombre: string): Promise<{ nombre: string }> => {
    return apiClient.patch<{ nombre: string }>('/auth/me/nombre', { nombre });
  },
};
