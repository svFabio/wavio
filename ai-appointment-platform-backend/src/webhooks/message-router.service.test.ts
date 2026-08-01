import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageRouterService, type NegocioCache } from './message-router.service';
import type { Negocio, Servicio, Configuracion } from '../domain/types';

const { mockEnviarMensaje } = vi.hoisted(() => ({
  mockEnviarMensaje: vi.fn(),
}));

vi.mock('../lib/whatsapp', () => ({
  enviarMensaje: mockEnviarMensaje,
}));

describe('MessageRouterService', () => {
  let service: MessageRouterService;
  let mockChatService: { findSessionByJid: ReturnType<typeof vi.fn> };
  let mockNegocioService: {
    findByWaPhoneNumberIdForInternal: ReturnType<typeof vi.fn>;
    getConfiguracion: ReturnType<typeof vi.fn>;
  };
  let mockServiciosService: { getAll: ReturnType<typeof vi.fn> };
  let mockCitasService: {
    updateLastAppointmentRating: ReturnType<typeof vi.fn>;
    getSlotDisponibles: ReturnType<typeof vi.fn>;
  };

  const mockNegocio: Negocio = {
    id: 1,
    googleId: 'g1',
    email: 'test@test.com',
    nombre: 'Test Spa',
    plan: 'FREE',
    waAccessToken: 'wa-token',
    waPhoneNumberId: '123456',
    waWabaId: null,
    waAppId: null,
    isWaConnected: false,
    geminiApiKey: null,
    creadoEn: new Date('2026-07-28'),
  };

  const mockServicio: Servicio = {
    id: 1,
    negocioId: 1,
    nombre: 'Corte de cabello',
    duracionMinutos: 60,
    bufferMinutos: 10,
    precio: 250,
    activo: true,
    creadoEn: new Date('2026-07-28'),
  };

  const mockConfig: Configuracion = {
    id: 1,
    trigger: '!cita',
    mensajeBienvenida: 'Hola!',
    mensajeConfirmacion: 'Gracias!',
    qrContenido: 'QR_CODE',
    qrFotoUrl: null,
    cobrarAdelanto: false,
    porcentajeAdelanto: 0,
    timezone: 'America/La_Paz',
    chatFlow: [],
    negocioId: 1,
  };

  beforeEach(() => {
    mockEnviarMensaje.mockClear();
    mockChatService = { findSessionByJid: vi.fn() };
    mockNegocioService = {
      findByWaPhoneNumberIdForInternal: vi.fn(),
      getConfiguracion: vi.fn(),
    };
    mockServiciosService = { getAll: vi.fn() };
    mockCitasService = {
      updateLastAppointmentRating: vi.fn(),
      getSlotDisponibles: vi.fn(),
    };
    service = new MessageRouterService(
      mockChatService as any,
      mockNegocioService as any,
      mockServiciosService as any,
      mockCitasService as any,
    );
  });

  describe('extractMessage', () => {
    it('should extract fields from a valid text message', () => {
      const result = service.extractMessage({
        from: '+521234567890',
        text: { body: 'Hola, quiero agendar' },
        id: 'wamid.abc123',
        type: 'text',
      });

      expect(result).toEqual({
        from: '+521234567890',
        textBody: 'Hola, quiero agendar',
        waMessageId: 'wamid.abc123',
      });
    });

    it('should return null for non-text message type', () => {
      const result = service.extractMessage({
        from: '+521234567890',
        type: 'image',
        id: 'wamid.abc123',
      });

      expect(result).toBeNull();
    });

    it('should return null when from is missing', () => {
      const result = service.extractMessage({
        text: { body: 'Hola' },
        id: 'wamid.abc123',
        type: 'text',
      });

      expect(result).toBeNull();
    });

    it('should return null when text body is missing', () => {
      const result = service.extractMessage({
        from: '+521234567890',
        text: {} as { body?: string },
        id: 'wamid.abc123',
        type: 'text',
      });

      expect(result).toBeNull();
    });

    it('should return null when waMessageId is missing', () => {
      const result = service.extractMessage({
        from: '+521234567890',
        text: { body: 'Hola' },
        type: 'text',
      });

      expect(result).toBeNull();
    });
  });

  describe('resolveNegocio', () => {
    it('should return negocio when phone number ID is found', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);

      const result = await service.resolveNegocio('123456');

      expect(result).toBe(mockNegocio);
      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).toHaveBeenCalledWith('123456');
    });

    it('should return null when phone number ID is not registered', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(null);

      const result = await service.resolveNegocio('unknown');

      expect(result).toBeNull();
    });
  });

  describe('handleSurveyResponse', () => {
    it('should return false when text is not a 1-5 rating', async () => {
      const result = await service.handleSurveyResponse(mockNegocio, '+521234567890', 'Hola');

      expect(result).toBe(false);
      expect(mockCitasService.updateLastAppointmentRating).not.toHaveBeenCalled();
    });

    it('should return false when rating is 0', async () => {
      const result = await service.handleSurveyResponse(mockNegocio, '+521234567890', '0');

      expect(result).toBe(false);
    });

    it('should return false when rating is 6', async () => {
      const result = await service.handleSurveyResponse(mockNegocio, '+521234567890', '6');

      expect(result).toBe(false);
    });

    it('should update rating and send thanks when cita exists', async () => {
      mockCitasService.updateLastAppointmentRating.mockResolvedValue(true);

      const result = await service.handleSurveyResponse(mockNegocio, '+521234567890', '5');

      expect(mockCitasService.updateLastAppointmentRating).toHaveBeenCalledWith(
        1,
        '+521234567890',
        5,
      );
      expect(result).toBe(true);
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        { waAccessToken: 'wa-token', waPhoneNumberId: '123456' },
        '+521234567890',
        expect.stringContaining('Gracias'),
      );
    });

    it('should return false when no cita matches the rating update', async () => {
      mockCitasService.updateLastAppointmentRating.mockResolvedValue(false);

      const result = await service.handleSurveyResponse(mockNegocio, '+521234567890', '3');

      expect(result).toBe(false);
      expect(mockEnviarMensaje).not.toHaveBeenCalled();
    });
  });

  describe('buildMessageContext', () => {
    const cache = new Map<number, NegocioCache>();

    beforeEach(() => {
      cache.clear();
      mockNegocioService.getConfiguracion.mockResolvedValue(mockConfig);
      mockServiciosService.getAll.mockResolvedValue([mockServicio]);
      mockCitasService.getSlotDisponibles.mockResolvedValue([]);
    });

    it('should build context with existing session state', async () => {
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'activo',
        datos: { fecha: '2026-08-01', horario: '10:00' },
      });

      const result = await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: 'Hola', waMessageId: 'wamid.1' },
        cache,
      );

      expect(result.negocio).toBe(mockNegocio);
      expect(result.contexto.estado).toBe('activo');
      expect(result.contexto.datos).toEqual({ fecha: '2026-08-01', horario: '10:00' });
      expect(result.serviciosDisponibles).toEqual(['Corte de cabello ($250)']);
      expect(result.cached.servicios).toEqual([mockServicio]);
      expect(result.cached.config).toBe(mockConfig);
    });

    it('should build context with INICIO state when no session exists', async () => {
      mockChatService.findSessionByJid.mockResolvedValue(null);

      const result = await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: 'Hola', waMessageId: 'wamid.1' },
        cache,
      );

      expect(result.contexto.estado).toBe('INICIO');
      expect(result.contexto.datos).toEqual({});
    });

    it('should resolve slots when contexto has a fecha', async () => {
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: '2026-08-01' },
      });
      mockCitasService.getSlotDisponibles.mockResolvedValue([
        { inicio: '09:00', fin: '10:00', staffId: null },
        { inicio: '10:00', fin: '11:00', staffId: null },
      ]);

      const result = await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: '10:00', waMessageId: 'wamid.1' },
        cache,
      );

      expect(result.slotsDisponibles).toEqual(['09:00', '10:00']);
      expect(mockCitasService.getSlotDisponibles).toHaveBeenCalledWith({
        negocioId: 1,
        servicioId: 1,
        fecha: '2026-08-01',
      });
    });

    it('should return empty slots when getSlotDisponibles throws', async () => {
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: '2026-08-01' },
      });
      mockCitasService.getSlotDisponibles.mockRejectedValue(new Error('Slot error'));

      const result = await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: '10:00', waMessageId: 'wamid.1' },
        cache,
      );

      expect(result.slotsDisponibles).toEqual([]);
    });

    it('should return empty slots when fecha is not set', async () => {
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'INICIO',
        datos: {},
      });

      const result = await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: 'Hola', waMessageId: 'wamid.1' },
        cache,
      );

      expect(result.slotsDisponibles).toEqual([]);
      expect(mockCitasService.getSlotDisponibles).not.toHaveBeenCalled();
    });

    it('should use cached negocio data on subsequent calls', async () => {
      mockChatService.findSessionByJid.mockResolvedValue(null);
      const populatedCache = new Map<number, NegocioCache>();
      populatedCache.set(1, {
        servicios: [mockServicio],
        config: mockConfig,
      });

      await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: 'Hola', waMessageId: 'wamid.1' },
        populatedCache,
      );

      expect(mockServiciosService.getAll).not.toHaveBeenCalled();
      expect(mockNegocioService.getConfiguracion).not.toHaveBeenCalled();
    });

    it('should handle chatFlow from config', async () => {
      const configWithFlow: Configuracion = {
        ...mockConfig,
        chatFlow: [
          {
            id: 'step1',
            titulo: 'Bienvenida',
            mensaje: 'Hola!',
            tipoInput: 'texto',
            activo: true,
          },
        ],
      };
      mockNegocioService.getConfiguracion.mockResolvedValue(configWithFlow);
      mockChatService.findSessionByJid.mockResolvedValue(null);

      const result = await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: 'Hola', waMessageId: 'wamid.1' },
        cache,
      );

      expect(result.chatFlow).toHaveLength(1);
      expect(result.chatFlow[0].titulo).toBe('Bienvenida');
    });

    it('should default chatFlow to empty array when config has none', async () => {
      const configWithoutFlow: Configuracion = {
        ...mockConfig,
        chatFlow: [],
      };
      mockNegocioService.getConfiguracion.mockResolvedValue(configWithoutFlow);
      mockChatService.findSessionByJid.mockResolvedValue(null);

      const result = await service.buildMessageContext(
        mockNegocio,
        { from: '+521234567890', textBody: 'Hola', waMessageId: 'wamid.1' },
        cache,
      );

      expect(result.chatFlow).toEqual([]);
    });
  });
});
