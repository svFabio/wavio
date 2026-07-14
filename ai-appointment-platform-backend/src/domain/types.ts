export type Rol = 'ADMIN' | 'STAFF';
export type DireccionMensaje = 'ENTRANTE' | 'SALIENTE';
export type Plan = 'FREE' | 'PRO';

export type EstadoCita = 'PENDIENTE' | 'EN_PROCESO' | 'VALIDACION_PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'NO_ASISTIO';
export type EstadoPago = 'PENDIENTE' | 'ESPERANDO_COMPROBANTE' | 'VERIFICADO' | 'RECHAZADO';

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
  fotoPerfil: string | null;
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
  horaFin: string;    // "13:00"
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
  qrContenido: string;
  cobrarAdelanto: boolean;
  porcentajeAdelanto: number;
  timezone: string;
  negocioId: number;
}

// ─── Availability Engine Types ─────────────────────────────────────────────

export interface Slot {
  inicio: string;        // "09:00"
  fin: string;           // "10:00"
  staffId: number | null;
}

export interface DisponibilidadParams {
  negocioId: number;
  servicioId: number;
  fecha: string;         // "2025-07-15"
  staffId?: number;
}

export interface RangoHorario {
  horaInicio: string;
  horaFin: string;
}
