// src/types/index.ts
export type EstadoCita =
  | 'PENDIENTE_PAGO'
  | 'VALIDANDO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'VALIDACION_PENDIENTE'
  | 'NO_ASISTIO';

export interface Cita {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string; // ISO String 2025-12-20
  horario: string; // "14:00"
  servicio: string;
  servicioId?: number;
  estadoPago?: string;
  estado: EstadoCita;
  comprobanteUrl?: string; // URL de la imagen del pago
  descripcion?: string;
  origen: string; // "virtual" | "presencial"
  recordatorio24h?: boolean;
  recordatorio1h?: boolean;
  rating?: number;
  comentario?: string;
  creadoEn: string;
}

export interface Horario {
  hora: string;
  disponible: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  email?: string | null;
  notas?: string | null;
  noShowCount: number;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MensajeChat {
  id: number;
  remoteJid: string;
  contenido: string;
  direccion: 'ENTRANTE' | 'SALIENTE';
  timestamp: string;
}

export interface Conversacion {
  remoteJid: string;
  ultimoMensaje: string;
  totalMensajes: number;
  ultimoContenido: string;
  ultimaDireccion: string;
  clienteNombre?: string | null;
  telefonoReal?: string;
}
