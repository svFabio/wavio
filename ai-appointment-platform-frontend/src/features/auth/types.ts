import type { Usuario } from '../../types';

export type Tab = 'login' | 'register';

export interface Negocio {
  id: number;
  nombre: string;
  plan: 'FREE' | 'PRO';
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
  negocios: Negocio[];
  esNuevo?: boolean;
}
