export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'OWNER' | 'ADMIN' | 'STAFF';
  creadoEn: string;
}

export interface UserFormData {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'STAFF';
}

export type InvitationEstado = 'PENDIENTE' | 'ACEPTADA' | 'CANCELADA' | 'EXPIRADA';

export interface Invitation {
  id: number;
  email: string;
  rol: 'ADMIN' | 'STAFF';
  estado: InvitationEstado;
  expiraEn: string;
  creadoEn: string;
}

export interface InvitationFormData {
  email: string;
  rol: 'ADMIN' | 'STAFF';
}
