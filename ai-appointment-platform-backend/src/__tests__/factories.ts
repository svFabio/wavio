let _nextId = 1;
export const resetIds = (): void => {
  _nextId = 1;
};
export const nextId = (): number => _nextId++;
export const today = (): Date => new Date('2026-07-28T00:00:00.000Z');
export const daysFromNow = (days: number): Date => {
  const d = today();
  d.setDate(d.getDate() + days);
  return d;
};

/* ─── NEGOCIO ──────────────────────────────────────────────────────── */

export interface FactoryNegocio {
  id: number;
  googleId: string | null;
  email: string;
  nombre: string;
  plan: string;
  waAccessToken: string | null;
  waPhoneNumberId: string | null;
  waWabaId: string | null;
  waAppId: string | null;
  isWaConnected: boolean;
  googleCalendarAccessToken: string | null;
  googleCalendarRefreshToken: string | null;
  googleCalendarId: string | null;
  isGoogleCalendarConnected: boolean;
  creadoEn: Date;
}

export const buildNegocio = (overrides: Partial<FactoryNegocio> = {}): FactoryNegocio => ({
  id: nextId(),
  googleId: `google_${_nextId}`,
  email: `negocio${_nextId}@test.com`,
  nombre: 'Test Negocio',
  plan: 'FREE',
  waAccessToken: null,
  waPhoneNumberId: null,
  waWabaId: null,
  waAppId: null,
  isWaConnected: false,
  googleCalendarAccessToken: null,
  googleCalendarRefreshToken: null,
  googleCalendarId: null,
  isGoogleCalendarConnected: false,
  creadoEn: today(),
  ...overrides,
});

/* ─── USUARIO ──────────────────────────────────────────────────────── */

export interface FactoryUsuario {
  id: number;
  nombre: string;
  email: string;
  password: string;
  googleId: string | null;
  fotoPerfil: string | null;
  rol: string;
  creadoEn: Date;
}

export const buildUsuario = (overrides: Partial<FactoryUsuario> = {}): FactoryUsuario => ({
  id: nextId(),
  nombre: 'Test Staff',
  email: `staff${_nextId}@test.com`,
  password: 'hashed_password',
  googleId: null,
  fotoPerfil: null,
  rol: 'STAFF',
  creadoEn: today(),
  ...overrides,
});

/* ─── USUARIO_NEGOCIO ──────────────────────────────────────────────── */

export interface FactoryUsuarioNegocio {
  usuarioId: number;
  negocioId: number;
  rol: string;
  creadoEn: Date;
}

export const buildUsuarioNegocio = (
  usuarioId: number,
  negocioId: number,
  overrides: Partial<FactoryUsuarioNegocio> = {},
): FactoryUsuarioNegocio => ({
  usuarioId,
  negocioId,
  rol: 'STAFF',
  creadoEn: today(),
  ...overrides,
});

/* ─── SERVICIO ─────────────────────────────────────────────────────── */

export interface FactoryServicio {
  id: number;
  negocioId: number;
  nombre: string;
  categoria: string | null;
  duracionMinutos: number;
  bufferMinutos: number;
  precio: number;
  activo: boolean;
  creadoEn: Date;
}

export const buildServicio = (
  negocioId: number,
  overrides: Partial<FactoryServicio> = {},
): FactoryServicio => ({
  id: nextId(),
  negocioId,
  nombre: 'Corte de cabello',
  categoria: null,
  duracionMinutos: 60,
  bufferMinutos: 10,
  precio: 250,
  activo: true,
  creadoEn: today(),
  ...overrides,
});

/* ─── HORARIO_NEGOCIO ──────────────────────────────────────────────── */

export interface FactoryHorarioNegocio {
  id: number;
  negocioId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export const buildHorarioNegocio = (
  negocioId: number,
  overrides: Partial<FactoryHorarioNegocio> = {},
): FactoryHorarioNegocio => ({
  id: nextId(),
  negocioId,
  diaSemana: 1,
  horaInicio: '09:00',
  horaFin: '18:00',
  activo: true,
  ...overrides,
});

/* ─── HORARIO_STAFF ────────────────────────────────────────────────── */

export interface FactoryHorarioStaff {
  id: number;
  usuarioId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export const buildHorarioStaff = (
  usuarioId: number,
  overrides: Partial<FactoryHorarioStaff> = {},
): FactoryHorarioStaff => ({
  id: nextId(),
  usuarioId,
  diaSemana: 1,
  horaInicio: '09:00',
  horaFin: '18:00',
  activo: true,
  ...overrides,
});

/* ─── HORARIO_ESPECIAL ─────────────────────────────────────────────── */

export interface FactoryHorarioEspecial {
  id: number;
  negocioId: number;
  fecha: Date;
  cerrado: boolean;
  horaInicio: string | null;
  horaFin: string | null;
}

export const buildHorarioEspecial = (
  negocioId: number,
  overrides: Partial<FactoryHorarioEspecial> = {},
): FactoryHorarioEspecial => ({
  id: nextId(),
  negocioId,
  fecha: daysFromNow(5),
  cerrado: false,
  horaInicio: '10:00',
  horaFin: '16:00',
  ...overrides,
});

/* ─── CLIENTE ──────────────────────────────────────────────────────── */

export interface FactoryCliente {
  id: number;
  negocioId: number;
  nombre: string;
  telefono: string;
  email: string | null;
  notas: string | null;
  noShowCount: number;
  blocked: boolean;
  magicToken: string | null;
  magicLinkExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const buildCliente = (
  negocioId: number,
  overrides: Partial<FactoryCliente> = {},
): FactoryCliente => ({
  id: nextId(),
  negocioId,
  nombre: 'Juan Pérez',
  telefono: '+521234567890',
  email: null,
  notas: null,
  noShowCount: 0,
  blocked: false,
  magicToken: null,
  magicLinkExpiry: null,
  createdAt: today(),
  updatedAt: today(),
  ...overrides,
});

/* ─── CITA ─────────────────────────────────────────────────────────── */

export interface FactoryCita {
  id: number;
  fecha: Date;
  horario: string;
  clienteNombre: string;
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
  recurrence: string | null;
  recurrenceId: string | null;
  recurrenceEnd: Date | null;
  negocioId: number;
  creadoEn: Date;
}

export const buildCita = (
  negocioId: number,
  overrides: Partial<FactoryCita> = {},
): FactoryCita => ({
  id: nextId(),
  fecha: daysFromNow(1),
  horario: '10:00',
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '+521234567890',
  servicio: 'Corte de cabello',
  servicioId: null,
  duracionMinutos: 60,
  staffId: null,
  estadoPago: 'PENDIENTE',
  monto: 250,
  estado: 'PENDIENTE',
  comprobanteUrl: null,
  descripcion: null,
  origen: 'whatsapp',
  recordatorio24h: false,
  recordatorio1h: false,
  encuestaEnviada: false,
  rating: null,
  comentario: null,
  recurrence: null,
  recurrenceId: null,
  recurrenceEnd: null,
  negocioId,
  creadoEn: today(),
  ...overrides,
});

/* ─── SESION_CHAT ──────────────────────────────────────────────────── */

export interface FactorySesionChat {
  id: string;
  negocioId: number;
  estado: string;
  datos: Record<string, unknown>;
  ultimoMensaje: Date;
}

export const buildSesionChat = (
  negocioId: number,
  overrides: Partial<FactorySesionChat> = {},
): FactorySesionChat => ({
  id: `chat_${nextId()}`,
  negocioId,
  estado: 'activo',
  datos: {},
  ultimoMensaje: today(),
  ...overrides,
});

/* ─── MENSAJE_CHAT ─────────────────────────────────────────────────── */

export interface FactoryMensajeChat {
  id: number;
  waMessageId: string | null;
  remoteJid: string;
  contenido: string;
  direccion: string;
  estadoEntrega: string;
  timestamp: Date;
  negocioId: number;
}

export const buildMensajeChat = (
  negocioId: number,
  overrides: Partial<FactoryMensajeChat> = {},
): FactoryMensajeChat => ({
  id: nextId(),
  waMessageId: null,
  remoteJid: '+521234567890@s.whatsapp.net',
  contenido: 'Hola, quiero agendar una cita',
  direccion: 'ENTRANTE',
  estadoEntrega: 'enviado',
  timestamp: today(),
  negocioId,
  ...overrides,
});

/* ─── CONFIGURACION ────────────────────────────────────────────────── */

export interface FactoryConfiguracion {
  id: number;
  negocioId: number;
  trigger: string;
  mensajeBienvenida: string;
  mensajeConfirmacion: string;
  qrContenido: string;
  qrFotoUrl: string | null;
  cobrarAdelanto: boolean;
  porcentajeAdelanto: number;
  timezone: string;
  chatFlow: Record<string, unknown>;
}

export const buildConfiguracion = (
  negocioId: number,
  overrides: Partial<FactoryConfiguracion> = {},
): FactoryConfiguracion => ({
  id: nextId(),
  negocioId,
  trigger: '!cita',
  mensajeBienvenida: 'Hola! Soy el asistente de citas.',
  mensajeConfirmacion: 'Comprobante recibido!',
  qrContenido: 'QR_PLACEHOLDER',
  qrFotoUrl: null,
  cobrarAdelanto: true,
  porcentajeAdelanto: 50,
  timezone: 'America/La_Paz',
  chatFlow: {},
  ...overrides,
});

/* ─── LISTA_ESPERA ─────────────────────────────────────────────────── */

export interface FactoryListaEspera {
  id: number;
  clienteNombre: string;
  clienteTelefono: string;
  servicioId: number | null;
  fechaPreferida: Date;
  horarioPreferido: string;
  estado: string;
  notificadoEn: Date | null;
  creadoEn: Date;
  negocioId: number;
}

export const buildListaEspera = (
  negocioId: number,
  overrides: Partial<FactoryListaEspera> = {},
): FactoryListaEspera => ({
  id: nextId(),
  clienteNombre: 'María García',
  clienteTelefono: '+529876543210',
  servicioId: null,
  fechaPreferida: daysFromNow(3),
  horarioPreferido: '14:00',
  estado: 'PENDIENTE',
  notificadoEn: null,
  creadoEn: today(),
  negocioId,
  ...overrides,
});

/* ─── PUSH_SUBSCRIPTION ────────────────────────────────────────────── */

export interface FactoryPushSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  negocioId: number;
  userId: number | null;
  createdAt: Date;
}

export const buildPushSubscription = (
  negocioId: number,
  overrides: Partial<FactoryPushSubscription> = {},
): FactoryPushSubscription => ({
  id: nextId(),
  endpoint: 'https://fcm.googleapis.com/test-endpoint',
  p256dh: 'test_p256dh_key',
  auth: 'test_auth_key',
  negocioId,
  userId: null,
  createdAt: today(),
  ...overrides,
});

/* ─── INVITACION ───────────────────────────────────────────────────── */

export interface FactoryInvitacion {
  id: number;
  negocioId: number;
  email: string;
  rol: string;
  tokenHash: string;
  expiraEn: Date;
  estado: string;
  creadoEn: Date;
  creadoPor: number;
  aceptadaEn: Date | null;
}

export const buildInvitacion = (
  negocioId: number,
  overrides: Partial<FactoryInvitacion> = {},
): FactoryInvitacion => ({
  id: nextId(),
  negocioId,
  email: `staff${_nextId}@test.com`,
  rol: 'STAFF',
  tokenHash: `token-hash-${nextId()}`,
  // La expiración debe quedar en el futuro respecto al reloj real del test,
  // porque el servicio compara contra new Date() en tiempo de ejecución.
  expiraEn: new Date(Date.now() + 72 * 60 * 60 * 1000),
  estado: 'PENDIENTE',
  creadoEn: today(),
  creadoPor: 1,
  aceptadaEn: null,
  ...overrides,
});
