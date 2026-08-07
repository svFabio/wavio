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
  rol: 'OWNER' | 'ADMIN' | 'STAFF';
}

export interface Invitation {
  id: string;
  email: string;
  rol: 'ADMIN' | 'STAFF';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  creadoEn: string;
}

export interface InvitationFormData {
  email: string;
  rol: 'ADMIN' | 'STAFF';
}
