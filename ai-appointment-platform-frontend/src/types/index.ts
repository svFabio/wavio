// src/types/index.ts
export type EstadoCita = 'PENDIENTE_PAGO' | 'VALIDANDO' | 'CONFIRMADA' | 'CANCELADA' | 'EXPIRADA';

export interface Cita {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string; // ISO String 2025-12-20
  horario: string;  // "14:00"
  servicio: string;
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