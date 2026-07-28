/**
 * Test factories for all Prisma models.
 *
 * Each factory returns a complete, valid object for its model.
 * Use `overrides` to customize specific fields for your test case.
 *
 * @example
 * const negocio = buildNegocio({ nombre: 'Mi Spa' });
 * const cita = buildCita({ negocioId: negocio.id, estado: 'CONFIRMADA' });
 */

import type {
  Negocio,
  Usuario,
  UsuarioNegocio,
  Servicio,
  HorarioNegocio,
  HorarioStaff,
  HorarioEspecial,
  Cliente,
  Cita,
  SesionChat,
  MensajeChat,
  Configuracion,
  ListaEspera,
  PushSubscription,
} from '@prisma/client';

/* ─── HELPERS ──────────────────────────────────────────────────────── */

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

type NegocioOverrides = Partial<Omit<Negocio, 'id' | 'creadoEn'>> & {
  id?: number;
  creadoEn?: Date;
};

export const buildNegocio = (overrides: NegocioOverrides = {}): Negocio => ({
  id: nextId(),
  googleId: `google_${_nextId}`,
  email: `negocio${_nextId}@test.com`,
  nombre: 'Test Negocio',
  plan: 'FREE' as const,
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

type UsuarioOverrides = Partial<Omit<Usuario, 'id' | 'creadoEn'>> & {
  id?: number;
  creadoEn?: Date;
};

export const buildUsuario = (overrides: UsuarioOverrides = {}): Usuario => ({
  id: nextId(),
  nombre: 'Test Staff',
  email: `staff${_nextId}@test.com`,
  password: 'hashed_password',
  googleId: null,
  fotoPerfil: null,
  rol: 'STAFF' as const,
  creadoEn: today(),
  ...overrides,
});

/* ─── USUARIO_NEGOCIO ──────────────────────────────────────────────── */

type UsuarioNegocioOverrides = Partial<
  Omit<UsuarioNegocio, 'usuarioId' | 'negocioId' | 'creadoEn'>
> & {
  creadoEn?: Date;
};

export const buildUsuarioNegocio = (
  usuarioId: number,
  negocioId: number,
  overrides: UsuarioNegocioOverrides = {},
): UsuarioNegocio => ({
  usuarioId,
  negocioId,
  rol: 'STAFF' as const,
  creadoEn: today(),
  ...overrides,
});

/* ─── SERVICIO ─────────────────────────────────────────────────────── */

type ServicioOverrides = Partial<Omit<Servicio, 'id' | 'creadoEn'>> & {
  id?: number;
  creadoEn?: Date;
};

export const buildServicio = (negocioId: number, overrides: ServicioOverrides = {}): Servicio => ({
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

type HorarioNegocioOverrides = Partial<HorarioNegocio> & { id?: number };

export const buildHorarioNegocio = (
  negocioId: number,
  overrides: HorarioNegocioOverrides = {},
): HorarioNegocio => ({
  id: nextId(),
  negocioId,
  diaSemana: 1, // lunes
  horaInicio: '09:00',
  horaFin: '18:00',
  activo: true,
  ...overrides,
});

/* ─── HORARIO_STAFF ────────────────────────────────────────────────── */

type HorarioStaffOverrides = Partial<HorarioStaff> & { id?: number };

export const buildHorarioStaff = (
  usuarioId: number,
  overrides: HorarioStaffOverrides = {},
): HorarioStaff => ({
  id: nextId(),
  usuarioId,
  diaSemana: 1,
  horaInicio: '09:00',
  horaFin: '18:00',
  activo: true,
  ...overrides,
});

/* ─── HORARIO_ESPECIAL ─────────────────────────────────────────────── */

type HorarioEspecialOverrides = Partial<Omit<HorarioEspecial, 'fecha'>> & {
  id?: number;
  fecha?: Date;
};

export const buildHorarioEspecial = (
  negocioId: number,
  overrides: HorarioEspecialOverrides = {},
): HorarioEspecial => ({
  id: nextId(),
  negocioId,
  fecha: daysFromNow(5),
  cerrado: false,
  horaInicio: '10:00',
  horaFin: '16:00',
  ...overrides,
});

/* ─── CLIENTE ──────────────────────────────────────────────────────── */

type ClienteOverrides = Partial<Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>> & {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export const buildCliente = (negocioId: number, overrides: ClienteOverrides = {}): Cliente => ({
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

type CitaOverrides = Partial<Omit<Cita, 'id' | 'fecha' | 'creadoEn' | 'monto'>> & {
  id?: number;
  fecha?: Date;
  creadoEn?: Date;
  monto?: number | { toString(): string };
};

export const buildCita = (negocioId: number, overrides: CitaOverrides = {}): Cita =>
  ({
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
  }) as unknown as Cita;

/* ─── SESION_CHAT ──────────────────────────────────────────────────── */

type SesionChatOverrides = Partial<Omit<SesionChat, 'id' | 'ultimoMensaje'>> & {
  ultimoMensaje?: Date;
};

export const buildSesionChat = (
  negocioId: number,
  overrides: SesionChatOverrides = {},
): SesionChat => ({
  id: `chat_${nextId()}`,
  negocioId,
  estado: 'activo',
  datos: {},
  ultimoMensaje: today(),
  ...overrides,
});

/* ─── MENSAJE_CHAT ─────────────────────────────────────────────────── */

type MensajeChatOverrides = Partial<Omit<MensajeChat, 'id' | 'timestamp'>> & {
  id?: number;
  timestamp?: Date;
};

export const buildMensajeChat = (
  negocioId: number,
  overrides: MensajeChatOverrides = {},
): MensajeChat => ({
  id: nextId(),
  waMessageId: null,
  remoteJid: '+521234567890@s.whatsapp.net',
  contenido: 'Hola, quiero agendar una cita',
  direccion: 'ENTRANTE' as const,
  estadoEntrega: 'enviado',
  timestamp: today(),
  negocioId,
  ...overrides,
});

/* ─── CONFIGURACION ────────────────────────────────────────────────── */

type ConfiguracionOverrides = Partial<Omit<Configuracion, 'id' | 'chatFlow' | 'negocioId'>> & {
  id?: number;
  chatFlow?: Record<string, unknown>;
};

export const buildConfiguracion = (
  negocioId: number,
  overrides: ConfiguracionOverrides = {},
): Configuracion => ({
  id: nextId(),
  negocioId,
  trigger: '!cita',
  mensajeBienvenida: 'Hola! Soy el asistente de citas.',
  mensajeConfirmacion: 'Comprobante recibido!',
  qrContenido: 'TU_CODIGO_QR_AQUI',
  qrFotoUrl: null,
  cobrarAdelanto: true,
  porcentajeAdelanto: 50,
  timezone: 'America/La_Paz',
  chatFlow: {},
  ...overrides,
});

/* ─── LISTA_ESPERA ─────────────────────────────────────────────────── */

type ListaEsperaOverrides = Partial<Omit<ListaEspera, 'id' | 'fechaPreferida' | 'creadoEn'>> & {
  id?: number;
  fechaPreferida?: Date;
  creadoEn?: Date;
};

export const buildListaEspera = (
  negocioId: number,
  overrides: ListaEsperaOverrides = {},
): ListaEspera => ({
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

type PushSubscriptionOverrides = Partial<Omit<PushSubscription, 'id' | 'createdAt'>> & {
  id?: number;
  createdAt?: Date;
};

export const buildPushSubscription = (
  negocioId: number,
  overrides: PushSubscriptionOverrides = {},
): PushSubscription => ({
  id: nextId(),
  endpoint: 'https://fcm.googleapis.com/test-endpoint',
  p256dh: 'test_p256dh_key',
  auth: 'test_auth_key',
  negocioId,
  userId: null,
  createdAt: today(),
  ...overrides,
});
