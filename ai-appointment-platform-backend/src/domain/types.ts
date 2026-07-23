export type Rol = 'ADMIN' | 'STAFF';

export interface Negocio {
  id: number;
  googleId: string;
  email: string;
  nombre: string;
  plan: string;
  waAccessToken: string | null;
  waPhoneNumberId: string | null;
  waWabaId: string | null;
  waAppId: string | null;
  isWaConnected: boolean;
  creadoEn: Date;
}

export interface Servicio {
  id: number;
  negocioId: number;
  nombre: string;
  duracionMinutos: number;
  bufferMinutos: number;
  precio: number;
  activo: boolean;
  creadoEn: Date;
}

export interface HorarioNegocio {
  id: number;
  negocioId: number;
  diaSemana: number; // 0=domingo, 1=lunes, ..., 6=sabado
  horaInicio: string; // "09:00"
  horaFin: string; // "13:00"
  activo: boolean;
}

export interface HorarioStaff {
  id: number;
  usuarioId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface HorarioEspecial {
  id: number;
  negocioId: number;
  fecha: Date;
  cerrado: boolean;
  horaInicio: string | null;
  horaFin: string | null;
}

export interface Cliente {
  id: number;
  negocioId: number;
  nombre: string;
  telefono: string;
  email: string | null;
  notas: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cita {
  id: number;
  fecha: Date;
  horario: string;
  clienteNombre: string | null;
  clienteTelefono: string;
  servicio: string;
  servicioId: number | null;
  duracionMinutos: number;
  staffId: number | null;
  estadoPago: string;
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
  direccion: string;
  estadoEntrega: string;
  timestamp: Date;
  negocioId: number;
}

export interface ChatFlowStep {
  id: string;
  titulo: string;
  mensaje: string;
  tipoInput: 'texto' | 'lista' | 'boton';
  opciones?: string[];
  activo: boolean;
}

export interface Configuracion {
  id: number;
  trigger: string;
  mensajeBienvenida: string;
  mensajeConfirmacion: string;
  qrContenido: string;
  qrFotoUrl: string | null;
  cobrarAdelanto: boolean;
  porcentajeAdelanto: number;
  timezone: string;
  chatFlow: ChatFlowStep[];
  negocioId: number;
}

export interface Slot {
  inicio: string; // "09:00"
  fin: string; // "10:00"
  staffId: number | null;
}

export interface DisponibilidadParams {
  negocioId: number;
  servicioId: number;
  fecha: string; // "2025-07-15"
  staffId?: number;
  timezone?: string;
}

export interface RangoHorario {
  horaInicio: string;
  horaFin: string;
}
