export type Rol = 'ADMIN' | 'STAFF';
export type DireccionMensaje = 'ENTRANTE' | 'SALIENTE';
export type Plan = 'FREE' | 'PRO';

export interface Negocio {
  id: number;
  googleId: string;
  email: string;
  nombre: string;
  plan: Plan;
  waAccessToken: string | null;
  waPhoneNumberId: string | null;
  waWabaId: string | null;
  waAppId: string | null;
  isWaConnected: boolean;
  creadoEn: Date;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password?: string | null;
  googleId: string | null;
  rol: Rol;
  negocioId: number;
  creadoEn: Date;
}

export interface SesionChat {
  id: string; // remoteJid
  estado: string;
  datos: Record<string, unknown>; // Prisma Json
  ultimoMensaje: Date;
  negocioId: number;
}

export interface Cita {
  id: number;
  fecha: Date;
  horario: string;
  clienteNombre: string | null;
  clienteTelefono: string;
  servicio: string;
  monto: number;
  estado: string;
  comprobanteUrl: string | null;
  descripcion: string | null;
  origen: string;
  recordatorio24h: boolean;
  recordatorio1h: boolean;
  encuestaEnviada: boolean;
  rating: number | null;
  comentario: string | null;
  creadoEn: Date;
  negocioId: number;
}

export interface MensajeChat {
  id: number;
  waMessageId: string | null;
  remoteJid: string;
  contenido: string;
  direccion: DireccionMensaje;
  estadoEntrega: string;
  timestamp: Date;
  negocioId: number;
}

export interface Configuracion {
  id: number;
  trigger: string;
  mensajeBienvenida: string;
  mensajeConfirmacion: string;
  servicios: Record<string, unknown> | unknown[]; // Prisma Json
  horarios: Record<string, unknown>; // Prisma Json
  qrContenido: string;
  cobrarAdelanto: boolean;
  porcentajeAdelanto: number;
  negocioId: number;
}
