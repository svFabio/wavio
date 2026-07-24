// src/types/index.ts
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'STAFF';
  fotoPerfil?: string;
}

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

export interface HorarioNegocio {
  id: number;
  diaSemana: number; // 0=domingo, 1=lunes, ..., 6=sabado
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface HorarioEspecial {
  id: number;
  fecha: string;
  cerrado: boolean;
  horaInicio: string | null;
  horaFin: string | null;
}

export type InputType = 'texto' | 'lista' | 'boton';

export interface ChatFlowStep {
  id: string;
  titulo: string;
  mensaje: string;
  tipoInput: InputType;
  opciones?: string[];
  activo: boolean;
}

export interface Configuracion {
  triggerWord?: string;
  mensajeBienvenida?: string;
  mensajeConfirmacion?: string;
  cobrarAdelanto?: boolean;
  porcentajeAdelanto?: number;
  chatFlow?: ChatFlowStep[];
  qrFotoUrl?: string | null;
  negocioNombre?: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  categoria?: string;
  duracionMinutos: number;
  bufferMinutos: number;
  precio: number;
  activo: boolean;
}
