import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CitasService } from './citas.service';
import type { CitasRepository } from './citas.repository';
import type { AvailabilityRepository } from './availability.repository';
import type { NegocioService } from '../negocio/negocio.service';
import type { ChatService } from '../chat/chat.service';
import type { EventsService } from '../events/events.service';
import { NotFoundError, ConflictError, ValidationError } from '../domain/errors';
import { buildCita, buildNegocio } from '../__tests__/factories';
import type { Cita } from '../domain/types';

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-jwt-secret',
    CORS_ORIGINS: undefined,
    GEMINI_API_KEY: 'test-gemini-key',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
    META_WEBHOOK_VERIFY_TOKEN: 'test-verify-token',
    META_API_VERSION: 'v19.0',
    META_WHATSAPP_TOKEN: 'test-whatsapp-token',
    META_PHONE_ID: 'test-phone-id',
    META_APP_SECRET: 'test-app-secret',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: undefined,
    GOOGLE_CALENDAR_CLIENT_ID: undefined,
    GOOGLE_CALENDAR_CLIENT_SECRET: undefined,
    GOOGLE_CALENDAR_REDIRECT_URI: undefined,
    BACKEND_URL: undefined,
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
    VAPID_PUBLIC_KEY: undefined,
    VAPID_PRIVATE_KEY: undefined,
    VAPID_EMAIL: undefined,
    LOG_LEVEL: 'silent',
  },
}));

vi.mock('../scheduling/availability-engine', () => ({
  getSlotsDisponibles: vi.fn(),
}));

import { getSlotsDisponibles } from '../scheduling/availability-engine';
const mockGetSlotsDisponibles = vi.mocked(getSlotsDisponibles);

const anyDate = expect.any(Date);

describe('CitasService', () => {
  let service: CitasService;
  let mockCitasRepository: Record<string, ReturnType<typeof vi.fn>>;
  let mockAvailabilityRepository: Record<string, ReturnType<typeof vi.fn>>;
  let mockNegocioService: Record<string, ReturnType<typeof vi.fn>>;
  let mockChatService: Record<string, ReturnType<typeof vi.fn>>;
  let mockEventsService: Record<string, ReturnType<typeof vi.fn>>;

  const negocioId = 1;
  const defaultCita = buildCita(negocioId) as unknown as Cita;
  const negocio = buildNegocio({
    waAccessToken: 'test-token',
    waPhoneNumberId: '123456',
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T00:00:00.000Z'));
    mockGetSlotsDisponibles.mockClear();

    mockCitasRepository = {
      getPendientes: vi.fn(),
      getByIdAndNegocio: vi.fn(),
      update: vi.fn(),
      getAgenda: vi.fn(),
      getCitasCount: vi.fn(),
      getSumaIngresosHoy: vi.fn(),
      createIfSlotAvailable: vi.fn(),
      reprogramarIfSlotAvailable: vi.fn(),
      createRecurringInstances: vi.fn(),
      cancelRecurringSeries: vi.fn(),
      findRecurringSeries: vi.fn(),
      updateLastAppointmentRating: vi.fn(),
    };

    mockAvailabilityRepository = {
      findPrimerServicioActivo: vi.fn(),
      findServicio: vi.fn(),
      findCitasForRange: vi.fn(),
      findHorariosNegocioAll: vi.fn(),
      findHorariosEspecialesInRange: vi.fn(),
      findHorarioStaffAll: vi.fn(),
    };

    mockNegocioService = {
      getConfiguracion: vi.fn(),
      findByIdForInternal: vi.fn(),
    };

    mockChatService = {
      getUltimoMensajeEntrantePorTelefono: vi.fn(),
    };

    mockEventsService = {
      emitCambioCitas: vi.fn(),
      emitNuevaCita: vi.fn(),
      sendWhatsAppMessage: vi.fn(),
    };

    service = new CitasService(
      mockCitasRepository as unknown as CitasRepository,
      mockAvailabilityRepository as unknown as AvailabilityRepository,
      mockNegocioService as unknown as NegocioService,
      mockChatService as unknown as ChatService,
      mockEventsService as unknown as EventsService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ─── getPendientes ─────────────────────────────────────────────────── */
  describe('getPendientes', () => {
    it('should return paginated pendientes', async () => {
      const citas = [defaultCita];
      mockCitasRepository.getPendientes.mockResolvedValue({
        data: citas,
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.getPendientes(negocioId, 1, 10);

      expect(mockCitasRepository.getPendientes).toHaveBeenCalledWith(negocioId, 1, 10);
      expect(result.data).toEqual(citas);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should handle empty pagination', async () => {
      mockCitasRepository.getPendientes.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const result = await service.getPendientes(negocioId, 1, 20);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should calculate totalPages rounding up', async () => {
      mockCitasRepository.getPendientes.mockResolvedValue({
        data: [defaultCita, defaultCita, defaultCita],
        total: 3,
        page: 1,
        limit: 2,
      });

      const result = await service.getPendientes(negocioId, 1, 2);

      expect(result.pagination.totalPages).toBe(2);
    });
  });

  /* ─── validarCita ────────────────────────────────────────────────────── */
  describe('validarCita', () => {
    it('should throw ValidationError for invalid action', async () => {
      await expect(service.validarCita(1, negocioId, 'INVALIDO')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when cita does not exist', async () => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(null);

      await expect(service.validarCita(1, negocioId, 'CONFIRMAR')).rejects.toThrow(NotFoundError);
    });

    it('should confirm cita and send WhatsApp with confirmation message', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, { estado: 'CONFIRMADA' });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);
      mockChatService.getUltimoMensajeEntrantePorTelefono.mockResolvedValue({
        remoteJid: '521234567890@s.whatsapp.net',
      });
      mockNegocioService.findByIdForInternal.mockResolvedValue(negocio);

      const result = await service.validarCita(1, negocioId, 'CONFIRMAR');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, { estado: 'CONFIRMADA' });
      expect(mockEventsService.emitCambioCitas).toHaveBeenCalledWith(negocioId);
      expect(mockEventsService.sendWhatsAppMessage).toHaveBeenCalledWith(
        { waAccessToken: 'test-token', waPhoneNumberId: '123456' },
        '521234567890@s.whatsapp.net',
        expect.stringContaining('CONFIRMADA'),
      );
      expect(result).toEqual(updatedCita);
    });

    it('should approve cita (alias for CONFIRMAR)', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, { estado: 'CONFIRMADA' });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);
      mockChatService.getUltimoMensajeEntrantePorTelefono.mockResolvedValue(null);
      mockNegocioService.findByIdForInternal.mockResolvedValue(negocio);

      await service.validarCita(1, negocioId, 'APROBAR');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, { estado: 'CONFIRMADA' });
    });

    it('should cancel cita and send WhatsApp with cancellation message', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, { estado: 'CANCELADA', comprobanteUrl: null });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);
      mockChatService.getUltimoMensajeEntrantePorTelefono.mockResolvedValue({
        remoteJid: '521234567890@s.whatsapp.net',
      });
      mockNegocioService.findByIdForInternal.mockResolvedValue(negocio);

      await service.validarCita(1, negocioId, 'CANCELAR');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, {
        estado: 'CANCELADA',
        comprobanteUrl: null,
      });
      expect(mockEventsService.sendWhatsAppMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringContaining('cancelada'),
      );
    });

    it('should reject cita (alias for CANCELAR)', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, { estado: 'CANCELADA', comprobanteUrl: null });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);
      mockChatService.getUltimoMensajeEntrantePorTelefono.mockResolvedValue(null);
      mockNegocioService.findByIdForInternal.mockResolvedValue(negocio);

      await service.validarCita(1, negocioId, 'RECHAZAR');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, {
        estado: 'CANCELADA',
        comprobanteUrl: null,
      });
    });

    it('should not send WhatsApp when no credentials exist', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, { estado: 'CONFIRMADA' });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);
      mockChatService.getUltimoMensajeEntrantePorTelefono.mockResolvedValue(null);
      mockNegocioService.findByIdForInternal.mockResolvedValue(
        buildNegocio({ waAccessToken: null, waPhoneNumberId: null }),
      );

      await service.validarCita(1, negocioId, 'CONFIRMAR');

      expect(mockEventsService.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should not throw when WhatsApp send fails (error caught)', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, { estado: 'CONFIRMADA' });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);
      mockChatService.getUltimoMensajeEntrantePorTelefono.mockResolvedValue({
        remoteJid: '521234567890@s.whatsapp.net',
      });
      mockNegocioService.findByIdForInternal.mockResolvedValue(negocio);
      mockEventsService.sendWhatsAppMessage.mockRejectedValue(new Error('Network error'));

      const result = await service.validarCita(1, negocioId, 'CONFIRMAR');

      expect(result).toEqual(updatedCita);
    });

    it('should fall back to clienteTelefono when no remoteJid found', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, { estado: 'CONFIRMADA' });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);
      mockChatService.getUltimoMensajeEntrantePorTelefono.mockResolvedValue(null);
      mockNegocioService.findByIdForInternal.mockResolvedValue(negocio);

      await service.validarCita(1, negocioId, 'CONFIRMAR');

      expect(mockEventsService.sendWhatsAppMessage).toHaveBeenCalledWith(
        expect.anything(),
        cita.clienteTelefono,
        expect.any(String),
      );
    });
  });

  /* ─── getAgenda ──────────────────────────────────────────────────────── */
  describe('getAgenda', () => {
    it('should return paginated agenda within date range', async () => {
      const citas = [defaultCita];
      mockCitasRepository.getAgenda.mockResolvedValue({
        data: citas,
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await service.getAgenda(negocioId, '2026-07-28');

      expect(mockCitasRepository.getAgenda).toHaveBeenCalledWith(
        negocioId,
        new Date('2026-07-28T00:00:00.000Z'),
        new Date('2026-07-28T23:59:59.999Z'),
        1,
        20,
      );
      expect(result.data).toEqual(citas);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('should use desde/hasta when provided instead of queryFecha', async () => {
      mockCitasRepository.getAgenda.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await service.getAgenda(
        negocioId,
        undefined,
        '2026-07-01T00:00:00.000Z',
        '2026-07-31T23:59:59.999Z',
      );

      expect(mockCitasRepository.getAgenda).toHaveBeenCalledWith(
        negocioId,
        new Date('2026-07-01T00:00:00.000Z'),
        new Date('2026-07-31T23:59:59.999Z'),
        1,
        20,
      );
    });

    it('should use default lookback/lookahead when no dates provided', async () => {
      mockCitasRepository.getAgenda.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await service.getAgenda(negocioId);

      expect(mockCitasRepository.getAgenda).toHaveBeenCalledWith(
        negocioId,
        expect.any(Date),
        expect.any(Date),
        1,
        20,
      );
    });

    it('should accept custom pagination params', async () => {
      mockCitasRepository.getAgenda.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 5,
      });

      const result = await service.getAgenda(negocioId, undefined, undefined, undefined, 2, 5);

      expect(mockCitasRepository.getAgenda).toHaveBeenCalledWith(
        negocioId,
        expect.any(Date),
        expect.any(Date),
        2,
        5,
      );
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
    });
  });

  /* ─── getResumen ─────────────────────────────────────────────────────── */
  describe('getResumen', () => {
    it('should return summary with counts and ingresos', async () => {
      mockCitasRepository.getCitasCount
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4);
      mockCitasRepository.getSumaIngresosHoy.mockResolvedValue(1000);

      const result = await service.getResumen(negocioId);

      expect(result).toEqual({
        totalHoy: 5,
        pendientes: 3,
        completadas: 4,
        ingresos: 1000,
      });
    });

    it('should return zero values when no data', async () => {
      mockCitasRepository.getCitasCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockCitasRepository.getSumaIngresosHoy.mockResolvedValue(0);

      const result = await service.getResumen(negocioId);

      expect(result).toEqual({
        totalHoy: 0,
        pendientes: 0,
        completadas: 0,
        ingresos: 0,
      });
    });
  });

  /* ─── getHorariosDisponibles ─────────────────────────────────────────── */
  describe('getHorariosDisponibles', () => {
    it('should throw ValidationError when fecha is empty', async () => {
      await expect(service.getHorariosDisponibles(negocioId, '')).rejects.toThrow(ValidationError);
    });

    it('should return available slots as string array with servicioId', async () => {
      mockGetSlotsDisponibles.mockResolvedValue([
        { inicio: '09:00', fin: '10:00', staffId: null },
        { inicio: '10:00', fin: '11:00', staffId: null },
      ]);
      mockNegocioService.getConfiguracion.mockResolvedValue({
        timezone: 'America/La_Paz',
      } as never);

      const result = await service.getHorariosDisponibles(negocioId, '2026-07-29', 1);

      expect(result).toEqual(['09:00', '10:00']);
      expect(mockGetSlotsDisponibles).toHaveBeenCalledWith(
        mockAvailabilityRepository,
        expect.objectContaining({ negocioId, servicioId: 1, fecha: '2026-07-29' }),
      );
    });

    it('should resolve first active servicio when none provided', async () => {
      mockAvailabilityRepository.findPrimerServicioActivo.mockResolvedValue({
        id: 42,
        negocioId,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
        activo: true,
        creadoEn: new Date(),
      });
      mockGetSlotsDisponibles.mockResolvedValue([]);
      mockNegocioService.getConfiguracion.mockResolvedValue({
        timezone: 'America/La_Paz',
      } as never);

      await service.getHorariosDisponibles(negocioId, '2026-07-29');

      expect(mockAvailabilityRepository.findPrimerServicioActivo).toHaveBeenCalledWith(negocioId);
      expect(mockGetSlotsDisponibles).toHaveBeenCalledWith(
        mockAvailabilityRepository,
        expect.objectContaining({ servicioId: 42 }),
      );
    });

    it('should throw ValidationError when no servicios configured', async () => {
      mockAvailabilityRepository.findPrimerServicioActivo.mockResolvedValue(null);

      await expect(service.getHorariosDisponibles(negocioId, '2026-07-29')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should pass staffId when provided', async () => {
      mockGetSlotsDisponibles.mockResolvedValue([]);
      mockNegocioService.getConfiguracion.mockResolvedValue({
        timezone: 'America/La_Paz',
      } as never);

      await service.getHorariosDisponibles(negocioId, '2026-07-29', 1, 3);

      expect(mockGetSlotsDisponibles).toHaveBeenCalledWith(
        mockAvailabilityRepository,
        expect.objectContaining({ staffId: 3 }),
      );
    });
  });

  /* ─── crearCitaAdmin ──────────────────────────────────────────────────── */
  describe('crearCitaAdmin', () => {
    const citaPayload = {
      clienteNombre: 'Juan Pérez',
      clienteTelefono: '+521234567890',
      fecha: '2026-07-29',
      horario: '10:00',
    };

    it('should create and return cita when slot is available', async () => {
      const createdCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '+521234567890',
        estado: 'CONFIRMADA',
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(createdCita);

      const result = await service.crearCitaAdmin(negocioId, citaPayload);

      expect(mockCitasRepository.createIfSlotAvailable).toHaveBeenCalled();
      expect(mockEventsService.emitCambioCitas).toHaveBeenCalledWith(negocioId);
      expect(mockEventsService.emitNuevaCita).toHaveBeenCalledWith(negocioId, expect.any(Object));
      expect(result).toEqual(createdCita);
    });

    it('should throw ValidationError when horario is not available', async () => {
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '09:00', fin: '10:00', staffId: null }]);
      mockAvailabilityRepository.findServicio.mockResolvedValue({
        id: 1,
        negocioId,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
        activo: true,
        creadoEn: new Date(),
      });

      await expect(
        service.crearCitaAdmin(negocioId, { ...citaPayload, servicioId: 1 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError when slot is occupied', async () => {
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(null);

      await expect(service.crearCitaAdmin(negocioId, citaPayload)).rejects.toThrow(ConflictError);
    });

    it('should resolve monto from servicio when monto is 0', async () => {
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(defaultCita);
      mockAvailabilityRepository.findServicio.mockResolvedValue({
        id: 1,
        negocioId,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 350,
        activo: true,
        creadoEn: new Date(),
      });

      await service.crearCitaAdmin(negocioId, {
        ...citaPayload,
        servicioId: 1,
        monto: 0,
      });

      expect(mockAvailabilityRepository.findServicio).toHaveBeenCalledWith(1, negocioId);
      const callArgs = mockCitasRepository.createIfSlotAvailable.mock.calls[0];
      expect(callArgs[3].monto).toBe(350);
    });

    it('should use provided monto over servicio lookup', async () => {
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(defaultCita);
      mockAvailabilityRepository.findServicio.mockResolvedValue({
        id: 1,
        negocioId,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 350,
        activo: true,
        creadoEn: new Date(),
      });

      await service.crearCitaAdmin(negocioId, {
        ...citaPayload,
        servicioId: 1,
        monto: 500,
      });

      expect(mockAvailabilityRepository.findServicio).not.toHaveBeenCalled();
    });

    it('should create with custom estado and origen', async () => {
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(defaultCita);

      await service.crearCitaAdmin(negocioId, {
        ...citaPayload,
        estado: 'PENDIENTE',
        origen: 'whatsapp',
      });

      expect(mockCitasRepository.createIfSlotAvailable).toHaveBeenCalledWith(
        negocioId,
        anyDate,
        '10:00',
        expect.objectContaining({
          estado: 'PENDIENTE',
          origen: 'whatsapp',
        }),
      );
    });

    it('should create with recurrence fields', async () => {
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(defaultCita);

      await service.crearCitaAdmin(negocioId, {
        ...citaPayload,
        recurrence: 'weekly',
        recurrenceId: 'rec-123',
        recurrenceEnd: new Date('2026-08-19'),
      });

      expect(mockCitasRepository.createIfSlotAvailable).toHaveBeenCalledWith(
        negocioId,
        anyDate,
        '10:00',
        expect.objectContaining({
          recurrence: 'weekly',
          recurrenceId: 'rec-123',
          recurrenceEnd: new Date('2026-08-19'),
        }),
      );
    });

    it('should skip slot validation when no servicioId', async () => {
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(defaultCita);

      await service.crearCitaAdmin(negocioId, { ...citaPayload, servicioId: null });

      expect(mockGetSlotsDisponibles).not.toHaveBeenCalled();
      expect(mockCitasRepository.createIfSlotAvailable).toHaveBeenCalled();
    });

    it('should create with staffId when provided', async () => {
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: 5 }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(defaultCita);

      await service.crearCitaAdmin(negocioId, { ...citaPayload, servicioId: 1, staffId: 5 });

      expect(mockCitasRepository.createIfSlotAvailable).toHaveBeenCalledWith(
        negocioId,
        anyDate,
        '10:00',
        expect.objectContaining({ staffId: 5 }),
      );
    });
  });

  /* ─── reprogramarCita ────────────────────────────────────────────────── */
  describe('reprogramarCita', () => {
    it('should throw ValidationError when fecha is empty', async () => {
      await expect(service.reprogramarCita(1, negocioId, '', '10:00')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError when horario is empty', async () => {
      await expect(service.reprogramarCita(1, negocioId, '2026-07-29', '')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw NotFoundError when cita does not exist', async () => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(null);

      await expect(service.reprogramarCita(1, negocioId, '2026-07-29', '10:00')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ValidationError when new horario is not available', async () => {
      const cita = buildCita(negocioId, { servicioId: 1 });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '09:00', fin: '10:00', staffId: null }]);

      await expect(service.reprogramarCita(1, negocioId, '2026-07-30', '10:00')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ConflictError when new slot is occupied', async () => {
      const cita = buildCita(negocioId);
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.reprogramarIfSlotAvailable.mockResolvedValue(null);

      await expect(service.reprogramarCita(1, negocioId, '2026-07-30', '14:00')).rejects.toThrow(
        ConflictError,
      );
    });

    it('should reprogram and return updated cita', async () => {
      const cita = buildCita(negocioId);
      const updatedCita = buildCita(negocioId, {
        fecha: new Date('2026-07-30T14:00:00.000Z'),
        horario: '14:00',
      });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.reprogramarIfSlotAvailable.mockResolvedValue(updatedCita);

      const result = await service.reprogramarCita(1, negocioId, '2026-07-30', '14:00');

      expect(mockCitasRepository.reprogramarIfSlotAvailable).toHaveBeenCalledWith(
        1,
        negocioId,
        anyDate,
        '14:00',
      );
      expect(mockEventsService.emitCambioCitas).toHaveBeenCalledWith(negocioId);
      expect(result).toEqual(updatedCita);
    });

    it('should skip slot validation when cita has no servicioId', async () => {
      const cita = buildCita(negocioId, { servicioId: null });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockCitasRepository.reprogramarIfSlotAvailable.mockResolvedValue(defaultCita);

      await service.reprogramarCita(1, negocioId, '2026-07-30', '14:00');

      expect(mockGetSlotsDisponibles).not.toHaveBeenCalled();
    });

    it('should pass staffId to availability check when cita has staffId', async () => {
      const cita = buildCita(negocioId, { servicioId: 1, staffId: 3 });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(cita);
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '14:00', fin: '15:00', staffId: 3 }]);
      mockCitasRepository.reprogramarIfSlotAvailable.mockResolvedValue(defaultCita);

      await service.reprogramarCita(1, negocioId, '2026-07-30', '14:00');

      expect(mockGetSlotsDisponibles).toHaveBeenCalledWith(
        mockAvailabilityRepository,
        expect.objectContaining({ staffId: 3 }),
      );
    });
  });

  /* ─── cambiarEstado ──────────────────────────────────────────────────── */
  describe('cambiarEstado', () => {
    it('should throw ValidationError for invalid estado', async () => {
      await expect(service.cambiarEstado(1, negocioId, 'INVALIDO')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw NotFoundError when cita does not exist', async () => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(null);

      await expect(service.cambiarEstado(1, negocioId, 'CONFIRMADA')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should update estado and emit event', async () => {
      const updatedCita = buildCita(negocioId, { estado: 'CONFIRMADA' });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(defaultCita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);

      const result = await service.cambiarEstado(1, negocioId, 'CONFIRMADA');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, { estado: 'CONFIRMADA' });
      expect(mockEventsService.emitCambioCitas).toHaveBeenCalledWith(negocioId);
      expect(result).toEqual(updatedCita);
    });

    it('should throw ValidationError when marking future cita as NO_ASISTIO', async () => {
      const futureCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
      });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(futureCita);

      await expect(service.cambiarEstado(1, negocioId, 'NO_ASISTIO')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should allow NO_ASISTIO for past cita', async () => {
      const pastCita = buildCita(negocioId, {
        fecha: new Date('2026-07-27T10:00:00.000Z'),
        horario: '10:00',
      });
      const updatedCita = buildCita(negocioId, {
        fecha: new Date('2026-07-27T10:00:00.000Z'),
        horario: '10:00',
        estado: 'NO_ASISTIO',
      });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(pastCita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);

      const result = await service.cambiarEstado(1, negocioId, 'NO_ASISTIO');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, { estado: 'NO_ASISTIO' });
      expect(result).toEqual(updatedCita);
    });

    it.each(['PENDIENTE', 'CANCELADA'])('should accept valid estado %s', async (estado) => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(defaultCita);
      mockCitasRepository.update.mockResolvedValue(buildCita(negocioId, { estado }));

      await service.cambiarEstado(1, negocioId, estado);

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, { estado });
    });
  });

  /* ─── actualizarDescripcion ───────────────────────────────────────────── */
  describe('actualizarDescripcion', () => {
    it('should throw NotFoundError when cita does not exist', async () => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(null);

      await expect(
        service.actualizarDescripcion(1, negocioId, 'Nueva descripción'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update description', async () => {
      const updatedCita = buildCita(negocioId, { descripcion: 'Nueva descripción' });
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(defaultCita);
      mockCitasRepository.update.mockResolvedValue(updatedCita);

      const result = await service.actualizarDescripcion(1, negocioId, 'Nueva descripción');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, {
        descripcion: 'Nueva descripción',
      });
      expect(result.descripcion).toBe('Nueva descripción');
    });

    it('should set null when description is empty string', async () => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(defaultCita);
      mockCitasRepository.update.mockResolvedValue(buildCita(negocioId, { descripcion: null }));

      await service.actualizarDescripcion(1, negocioId, '');

      expect(mockCitasRepository.update).toHaveBeenCalledWith(1, { descripcion: null });
    });
  });

  /* ─── crearCitaRecurente ──────────────────────────────────────────────── */
  describe('crearCitaRecurente', () => {
    const recurrenteData = {
      clienteNombre: 'Juan Pérez',
      clienteTelefono: '+521234567890',
      fecha: '2026-07-29',
      horario: '10:00',
      servicioId: 1 as number | null,
      staffId: null as number | null,
      duracionMinutos: 60,
      monto: 250,
      recurrence: 'weekly' as const,
      recurrenceEnd: '2026-08-19',
    };

    beforeEach(() => {
      const servicio = {
        id: 1,
        negocioId,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
        activo: true,
        creadoEn: new Date('2026-07-28'),
      };
      mockAvailabilityRepository.findServicio.mockResolvedValue(servicio);
      mockAvailabilityRepository.findHorariosNegocioAll.mockResolvedValue(
        [0, 1, 2, 3, 4, 5, 6].map((d) => ({
          id: d,
          negocioId,
          diaSemana: d,
          horaInicio: '09:00',
          horaFin: '18:00',
          activo: true,
        })),
      );
      mockAvailabilityRepository.findHorariosEspecialesInRange.mockResolvedValue([]);
      mockAvailabilityRepository.findCitasForRange.mockResolvedValue([]);
    });

    it('should create base cita and recurring instances', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
        monto: 250,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockCitasRepository.createRecurringInstances.mockResolvedValue(3);

      const result = await service.crearCitaRecurente(negocioId, recurrenteData);

      expect(result.base).toEqual(baseCita);
      expect(result.instancesCreated).toBe(3);
      expect(mockEventsService.emitCambioCitas).toHaveBeenCalledTimes(2);
    });

    it('should return zero instances when recurrenceEnd is before first candidate', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
        monto: 250,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);

      const result = await service.crearCitaRecurente(negocioId, {
        ...recurrenteData,
        recurrenceEnd: '2026-07-29',
      });

      expect(result.instancesCreated).toBe(0);
    });

    it('should throw ValidationError when servicio is not found', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockAvailabilityRepository.findServicio.mockResolvedValue(null);

      await expect(service.crearCitaRecurente(negocioId, recurrenteData)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should handle biweekly recurrence', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
        monto: 250,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockCitasRepository.createRecurringInstances.mockResolvedValue(2);

      const result = await service.crearCitaRecurente(negocioId, {
        ...recurrenteData,
        recurrence: 'biweekly',
        recurrenceEnd: '2026-08-26',
      });

      expect(result.instancesCreated).toBe(2);
    });

    it('should handle monthly recurrence', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
        monto: 250,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockCitasRepository.createRecurringInstances.mockResolvedValue(2);

      const result = await service.crearCitaRecurente(negocioId, {
        ...recurrenteData,
        recurrence: 'monthly',
        recurrenceEnd: '2026-09-30',
      });

      expect(result.instancesCreated).toBe(2);
    });

    it('should skip instances where slot is occupied (existing appointment conflict)', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
        monto: 250,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockAvailabilityRepository.findCitasForRange.mockResolvedValue([
        { fecha: new Date('2026-08-05T00:00:00.000Z'), horario: '10:00', duracionMinutos: 60 },
      ]);
      mockCitasRepository.createRecurringInstances.mockResolvedValue(2);

      const result = await service.crearCitaRecurente(negocioId, {
        ...recurrenteData,
        recurrenceEnd: '2026-08-19',
      });

      expect(result.instancesCreated).toBe(2);
      expect(mockCitasRepository.createRecurringInstances).toHaveBeenCalled();
    });

    it('should filter out instances on closed days', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
        monto: 250,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: null }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockAvailabilityRepository.findHorariosEspecialesInRange.mockResolvedValue([
        {
          id: 1,
          negocioId,
          fecha: new Date('2026-08-05T00:00:00.000Z'),
          cerrado: true,
          horaInicio: null,
          horaFin: null,
        },
      ]);
      mockCitasRepository.createRecurringInstances.mockResolvedValue(2);

      const result = await service.crearCitaRecurente(negocioId, {
        ...recurrenteData,
        recurrenceEnd: '2026-08-19',
      });

      expect(result.instancesCreated).toBe(2);
    });

    it('should use staffId when provided for availability filtering', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: 1,
        staffId: 5,
        monto: 250,
      });
      mockGetSlotsDisponibles.mockResolvedValue([{ inicio: '10:00', fin: '11:00', staffId: 5 }]);
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockAvailabilityRepository.findHorarioStaffAll.mockResolvedValue([
        { id: 1, usuarioId: 5, diaSemana: 0, horaInicio: '09:00', horaFin: '18:00', activo: true },
        { id: 2, usuarioId: 5, diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', activo: true },
        { id: 3, usuarioId: 5, diaSemana: 2, horaInicio: '09:00', horaFin: '18:00', activo: true },
        { id: 4, usuarioId: 5, diaSemana: 3, horaInicio: '09:00', horaFin: '18:00', activo: true },
        { id: 5, usuarioId: 5, diaSemana: 4, horaInicio: '09:00', horaFin: '18:00', activo: true },
        { id: 6, usuarioId: 5, diaSemana: 5, horaInicio: '09:00', horaFin: '18:00', activo: true },
        { id: 7, usuarioId: 5, diaSemana: 6, horaInicio: '09:00', horaFin: '18:00', activo: true },
      ]);
      mockCitasRepository.createRecurringInstances.mockResolvedValue(3);

      const result = await service.crearCitaRecurente(negocioId, {
        ...recurrenteData,
        staffId: 5,
        recurrenceEnd: '2026-08-19',
      });

      expect(result.instancesCreated).toBe(3);
    });

    it('should work without servicioId (non-servicio path)', async () => {
      const baseCita = buildCita(negocioId, {
        fecha: new Date('2026-07-29T10:00:00.000Z'),
        horario: '10:00',
        servicioId: null,
        monto: 250,
      });
      mockCitasRepository.createIfSlotAvailable.mockResolvedValue(baseCita);
      mockCitasRepository.createRecurringInstances.mockResolvedValue(2);

      const result = await service.crearCitaRecurente(negocioId, {
        ...recurrenteData,
        servicioId: null,
        recurrenceEnd: '2026-08-12',
      });

      expect(result.instancesCreated).toBe(2);
      expect(mockAvailabilityRepository.findServicio).not.toHaveBeenCalled();
    });
  });

  /* ─── cancelarSerieRecurente ─────────────────────────────────────────── */
  describe('cancelarSerieRecurente', () => {
    it('should cancel recurring series and return count', async () => {
      mockCitasRepository.cancelRecurringSeries.mockResolvedValue(3);

      const result = await service.cancelarSerieRecurente('rec-123', negocioId);

      expect(mockCitasRepository.cancelRecurringSeries).toHaveBeenCalledWith('rec-123');
      expect(mockEventsService.emitCambioCitas).toHaveBeenCalledWith(negocioId);
      expect(result).toBe(3);
    });

    it('should return 0 when no citas to cancel', async () => {
      mockCitasRepository.cancelRecurringSeries.mockResolvedValue(0);

      const result = await service.cancelarSerieRecurente('rec-999', negocioId);

      expect(result).toBe(0);
    });
  });

  /* ─── getSeriesRecurente ─────────────────────────────────────────────── */
  describe('getSeriesRecurente', () => {
    it('should return citas in series', async () => {
      const series = [
        buildCita(negocioId, { recurrenceId: 'rec-123' }),
        buildCita(negocioId, { recurrenceId: 'rec-123', fecha: new Date('2026-08-05') }),
      ];
      mockCitasRepository.findRecurringSeries.mockResolvedValue(series);

      const result = await service.getSeriesRecurente('rec-123');

      expect(mockCitasRepository.findRecurringSeries).toHaveBeenCalledWith('rec-123');
      expect(result).toEqual(series);
    });

    it('should return empty array when series not found', async () => {
      mockCitasRepository.findRecurringSeries.mockResolvedValue([]);

      const result = await service.getSeriesRecurente('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  /* ─── getByIdAndNegocio ──────────────────────────────────────────────── */
  describe('getByIdAndNegocio', () => {
    it('should return cita when found', async () => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(defaultCita);

      const result = await service.getByIdAndNegocio(1, negocioId);

      expect(mockCitasRepository.getByIdAndNegocio).toHaveBeenCalledWith(1, negocioId);
      expect(result).toEqual(defaultCita);
    });

    it('should return null when not found', async () => {
      mockCitasRepository.getByIdAndNegocio.mockResolvedValue(null);

      const result = await service.getByIdAndNegocio(999, negocioId);

      expect(result).toBeNull();
    });
  });

  /* ─── getSlotDisponibles ─────────────────────────────────────────────── */
  describe('getSlotDisponibles', () => {
    it('should delegate to availability engine with params', async () => {
      const params = {
        negocioId,
        servicioId: 1,
        fecha: '2026-07-29',
      };
      const expectedSlots = [
        { inicio: '09:00', fin: '10:00', staffId: null },
        { inicio: '10:00', fin: '11:00', staffId: null },
      ];
      mockGetSlotsDisponibles.mockResolvedValue(expectedSlots);

      const result = await service.getSlotDisponibles(params);

      expect(mockGetSlotsDisponibles).toHaveBeenCalledWith(mockAvailabilityRepository, params);
      expect(result).toEqual(expectedSlots);
    });
  });

  /* ─── updateLastAppointmentRating ────────────────────────────────────── */
  describe('updateLastAppointmentRating', () => {
    it('should return true when rating is updated', async () => {
      mockCitasRepository.updateLastAppointmentRating.mockResolvedValue(true);

      const result = await service.updateLastAppointmentRating(negocioId, '+521234567890', 5);

      expect(mockCitasRepository.updateLastAppointmentRating).toHaveBeenCalledWith(
        negocioId,
        '+521234567890',
        5,
      );
      expect(result).toBe(true);
    });

    it('should return false when no matching cita', async () => {
      mockCitasRepository.updateLastAppointmentRating.mockResolvedValue(false);

      const result = await service.updateLastAppointmentRating(negocioId, '+529999999999', 3);

      expect(result).toBe(false);
    });
  });
});
