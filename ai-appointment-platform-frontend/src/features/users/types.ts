export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'STAFF';
  creadoEn: string;
}

export interface UserFormData {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'STAFF';
}
