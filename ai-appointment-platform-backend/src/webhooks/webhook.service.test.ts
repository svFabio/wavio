import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookService, parsearFechaRelativa, formatearFechaEnZona } from './webhook.service';
import type { Negocio, Servicio, Configuracion } from '../domain/types';

const { mockEnviarMensaje, mockEnviarImagen, mockProcesarMensajeConIA } = vi.hoisted(() => ({
  mockEnviarMensaje: vi.fn(),
  mockEnviarImagen: vi.fn(),
  mockProcesarMensajeConIA: vi.fn(),
}));

vi.mock('../lib/whatsapp', () => ({
  enviarMensaje: mockEnviarMensaje,
  enviarImagen: mockEnviarImagen,
}));

vi.mock('../chat/ai-engine', () => ({
  procesarMensajeConIA: mockProcesarMensajeConIA,
}));

describe('WebhookService', () => {
  let service: WebhookService;
  let mockChatService: {
    createMensaje: ReturnType<typeof vi.fn>;
    findSessionByJid: ReturnType<typeof vi.fn>;
    upsertSession: ReturnType<typeof vi.fn>;
    updateEstadoEntrega: ReturnType<typeof vi.fn>;
  };
  let mockNegocioService: {
    findByWaPhoneNumberIdForInternal: ReturnType<typeof vi.fn>;
    getConfiguracion: ReturnType<typeof vi.fn>;
  };
  let mockServiciosService: { getAll: ReturnType<typeof vi.fn> };
  let mockCitasService: {
    updateLastAppointmentRating: ReturnType<typeof vi.fn>;
    getSlotDisponibles: ReturnType<typeof vi.fn>;
    crearCitaAdmin: ReturnType<typeof vi.fn>;
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

  const buildPayload = (
    overrides: Partial<{
      object: string;
      messages: Array<Record<string, unknown>>;
      statuses: Array<Record<string, unknown>>;
      phoneNumberId: string;
    }> = {},
  ): Record<string, unknown> => ({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              metadata: {
                phone_number_id: overrides.phoneNumberId ?? '123456',
              },
              messages: overrides.messages ?? [],
              statuses: overrides.statuses,
            },
          },
        ],
      },
    ],
    ...(overrides.object ? { object: overrides.object } : {}),
  });

  beforeEach(() => {
    mockChatService = {
      createMensaje: vi.fn(),
      findSessionByJid: vi.fn(),
      upsertSession: vi.fn(),
      updateEstadoEntrega: vi.fn(),
    };
    mockNegocioService = {
      findByWaPhoneNumberIdForInternal: vi.fn(),
      getConfiguracion: vi.fn(),
    };
    mockServiciosService = { getAll: vi.fn() };
    mockCitasService = {
      updateLastAppointmentRating: vi.fn(),
      getSlotDisponibles: vi.fn(),
      crearCitaAdmin: vi.fn(),
    };
    service = new WebhookService(
      mockChatService as any,
      mockNegocioService as any,
      mockServiciosService as any,
      mockCitasService as any,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processWithRetry', () => {
    it('should succeed on first attempt', async () => {
      vi.spyOn(
        service as unknown as { processWhatsAppPayload: ReturnType<typeof vi.fn> },
        'processWhatsAppPayload',
      ).mockResolvedValue(undefined);

      await service.processWithRetry({ object: 'whatsapp_business_account' });

      expect(
        (service as unknown as { processWhatsAppPayload: ReturnType<typeof vi.fn> })
          .processWhatsAppPayload,
      ).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const spy = vi
        .spyOn(
          service as unknown as { processWhatsAppPayload: ReturnType<typeof vi.fn> },
          'processWhatsAppPayload',
        )
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce(undefined);

      await service.processWithRetry({ object: 'whatsapp_business_account' }, 3);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should exhaust all retries and not throw', async () => {
      const spy = vi
        .spyOn(
          service as unknown as { processWhatsAppPayload: ReturnType<typeof vi.fn> },
          'processWhatsAppPayload',
        )
        .mockRejectedValue(new Error('Persistent error'));

      await service.processWithRetry({ object: 'whatsapp_business_account' }, 2);

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('processWhatsAppPayload — early returns', () => {
    it('should do nothing when object is not whatsapp_business_account', async () => {
      await service.processWhatsAppPayload({ object: 'other' });

      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).not.toHaveBeenCalled();
    });

    it('should do nothing when entry is not an array', async () => {
      await service.processWhatsAppPayload({
        object: 'whatsapp_business_account',
        entry: 'not-array',
      });

      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).not.toHaveBeenCalled();
    });

    it('should do nothing when entry is empty', async () => {
      await service.processWhatsAppPayload({
        object: 'whatsapp_business_account',
        entry: [],
      });

      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).not.toHaveBeenCalled();
    });
  });

  describe('processWhatsAppPayload — message handling', () => {
    it('should skip non-text message types', async () => {
      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.img',
            type: 'image',
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).not.toHaveBeenCalled();
    });

    it('should skip message when phoneNumberId is missing', async () => {
      const body = buildPayload({
        phoneNumberId: '',
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: { body: 'Hola' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).not.toHaveBeenCalled();
    });

    it('should skip message when from is missing', async () => {
      const body = buildPayload({
        messages: [
          {
            id: 'wamid.1',
            type: 'text',
            text: { body: 'Hola' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).not.toHaveBeenCalled();
    });

    it('should skip message when text body is missing', async () => {
      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: {},
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockNegocioService.findByWaPhoneNumberIdForInternal).not.toHaveBeenCalled();
    });

    it('should skip message when negocio is not found for phoneNumberId', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(null);

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: { body: 'Hola' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockChatService.createMensaje).not.toHaveBeenCalled();
    });
  });

  describe('processWhatsAppPayload — survey response', () => {
    it('should process a valid survey rating (1-5)', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);
      mockCitasService.updateLastAppointmentRating.mockResolvedValue(true);

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: { body: '5' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockChatService.createMensaje).toHaveBeenCalledWith({
        remoteJid: '+521234567890',
        contenido: '5',
        direccion: 'ENTRANTE',
        waMessageId: 'wamid.1',
        estadoEntrega: 'entregado',
        negocioId: 1,
      });
      expect(mockCitasService.updateLastAppointmentRating).toHaveBeenCalledWith(
        1,
        '+521234567890',
        5,
      );
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        { waAccessToken: 'wa-token', waPhoneNumberId: '123456' },
        '+521234567890',
        expect.stringContaining('Gracias'),
      );
      expect(mockServiciosService.getAll).not.toHaveBeenCalled();
    });

    it('should fall through to AI processing when survey rating has no matching cita', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);
      mockCitasService.updateLastAppointmentRating.mockResolvedValue(false);
      mockServiciosService.getAll.mockResolvedValue([mockServicio]);
      mockNegocioService.getConfiguracion.mockResolvedValue(mockConfig);
      mockChatService.findSessionByJid.mockResolvedValue(null);
      mockCitasService.getSlotDisponibles.mockResolvedValue([]);
      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'OTRO',
        respuestaSugerida: 'Bienvenido!',
      });

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: { body: '3' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockProcesarMensajeConIA).toHaveBeenCalled();
      expect(mockChatService.upsertSession).toHaveBeenCalled();
    });

    it('should ignore non-numeric text as survey', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);
      mockServiciosService.getAll.mockResolvedValue([mockServicio]);
      mockNegocioService.getConfiguracion.mockResolvedValue(mockConfig);
      mockChatService.findSessionByJid.mockResolvedValue(null);
      mockCitasService.getSlotDisponibles.mockResolvedValue([]);
      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'OTRO',
        respuestaSugerida: 'Hola!',
      });

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: { body: 'Hola, quiero info' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockCitasService.updateLastAppointmentRating).not.toHaveBeenCalled();
      expect(mockProcesarMensajeConIA).toHaveBeenCalled();
    });
  });

  describe('processWhatsAppPayload — full AI message flow', () => {
    beforeEach(() => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);
      mockServiciosService.getAll.mockResolvedValue([mockServicio]);
      mockNegocioService.getConfiguracion.mockResolvedValue(mockConfig);
      mockCitasService.getSlotDisponibles.mockResolvedValue([]);
      mockChatService.findSessionByJid.mockResolvedValue(null);
      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'OTRO',
        respuestaSugerida: 'Bienvenido a Test Spa!',
      });
    });

    it('should process a text message through the full pipeline', async () => {
      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.abc',
            type: 'text',
            text: { body: 'Hola' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockChatService.createMensaje).toHaveBeenCalledWith({
        remoteJid: '+521234567890',
        contenido: 'Hola',
        direccion: 'ENTRANTE',
        waMessageId: 'wamid.abc',
        estadoEntrega: 'entregado',
        negocioId: 1,
      });
      expect(mockServiciosService.getAll).toHaveBeenCalledWith(1);
      expect(mockNegocioService.getConfiguracion).toHaveBeenCalledWith(1);
      expect(mockChatService.findSessionByJid).toHaveBeenCalled();
      expect(mockProcesarMensajeConIA).toHaveBeenCalledWith(
        'Hola',
        expect.objectContaining({ estado: 'INICIO' }),
        ['Corte de cabello ($250)'],
        [],
        [],
        undefined,
        expect.any(Function),
      );
      expect(mockChatService.upsertSession).toHaveBeenCalled();
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        { waAccessToken: 'wa-token', waPhoneNumberId: '123456' },
        '+521234567890',
        expect.stringContaining('Bienvenido'),
      );
    });

    it('should use cached negocio for second message from same business', async () => {
      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: { body: 'Hola' },
          },
          {
            from: '+521234567891',
            id: 'wamid.2',
            type: 'text',
            text: { body: 'Info' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockServiciosService.getAll).toHaveBeenCalledTimes(1);
      expect(mockNegocioService.getConfiguracion).toHaveBeenCalledTimes(1);
    });

    it('should load slots when AI context has a fecha', async () => {
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: '2026-08-01' },
      });
      mockCitasService.getSlotDisponibles.mockResolvedValue([
        { inicio: '09:00', fin: '10:00', staffId: null },
      ]);

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.abc',
            type: 'text',
            text: { body: '10:00' },
          },
        ],
      });

      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'AGENDAR',
      });

      await service.processWhatsAppPayload(body);

      expect(mockCitasService.getSlotDisponibles).toHaveBeenCalledWith({
        negocioId: 1,
        servicioId: 1,
        fecha: '2026-08-01',
      });
      expect(mockProcesarMensajeConIA).toHaveBeenCalledWith(
        '10:00',
        expect.any(Object),
        expect.any(Array),
        ['09:00'],
        [],
        undefined,
        expect.any(Function),
      );
    });

    it('should provide an executor that returns available slots for consultar_disponibilidad', async () => {
      mockCitasService.getSlotDisponibles.mockResolvedValue([
        { inicio: '09:00', fin: '10:00', staffId: null },
        { inicio: '10:00', fin: '11:00', staffId: null },
      ]);
      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'OTRO',
        respuestaSugerida: 'Ok',
      });

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.tool',
            type: 'text',
            text: { body: 'Horarios' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      const args = mockProcesarMensajeConIA.mock.calls[0];
      const ejecutarHerramienta = args[6] as (
        nombre: string,
        args: Record<string, unknown>,
      ) => Promise<unknown>;

      expect(typeof ejecutarHerramienta).toBe('function');

      const slots = await ejecutarHerramienta('consultar_disponibilidad', {
        fecha: '2026-08-05',
      });

      expect(mockCitasService.getSlotDisponibles).toHaveBeenCalledWith({
        negocioId: 1,
        servicioId: 1,
        fecha: '2026-08-05',
      });
      expect(slots).toEqual(['09:00', '10:00']);
    });

    it('should continue processing remaining messages when one fails', async () => {
      mockChatService.createMensaje
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(undefined);

      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'OTRO',
        respuestaSugerida: 'Ok',
      });

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.1',
            type: 'text',
            text: { body: 'Fail' },
          },
          {
            from: '+521234567891',
            id: 'wamid.2',
            type: 'text',
            text: { body: 'Ok' },
          },
        ],
      });

      await expect(service.processWhatsAppPayload(body)).resolves.not.toThrow();

      expect(mockChatService.createMensaje).toHaveBeenCalledTimes(2);
    });

    it('should persist extracted entities and final state after handleAIResponse', async () => {
      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'AGENDAR',
        entidades: { fecha: 'mañana' },
      });
      mockCitasService.getSlotDisponibles.mockResolvedValue([
        { inicio: '09:00', fin: '10:00', staffId: null },
      ]);

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.memory',
            type: 'text',
            text: { body: 'Quiero cita para mañana' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockCitasService.getSlotDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
      );

      expect(mockChatService.upsertSession).toHaveBeenCalledTimes(1);
      const upsertArgs = mockChatService.upsertSession.mock.calls[0];
      expect(upsertArgs[2].estado).toBe('ESPERANDO_HORA');
      expect(upsertArgs[2].datos.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('processWhatsAppPayload — agendar flow', () => {
    it('should create appointment when AI returns AGENDAR intent', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);
      mockServiciosService.getAll.mockResolvedValue([mockServicio]);
      mockNegocioService.getConfiguracion.mockResolvedValue(mockConfig);
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'CONFIRMANDO_FECHA',
        datos: {
          fecha: '2026-08-01',
          horario: '10:00',
          nombre: 'Juan',
        },
      });
      mockCitasService.getSlotDisponibles.mockResolvedValue([
        { inicio: '09:00', fin: '10:00', staffId: null },
      ]);
      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'AGENDAR',
      });
      mockCitasService.crearCitaAdmin.mockResolvedValue({
        id: 42,
        monto: 0,
      });

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.abc',
            type: 'text',
            text: { body: 'Si, agendalo' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockCitasService.crearCitaAdmin).toHaveBeenCalledWith(1, {
        clienteNombre: 'Juan',
        clienteTelefono: '+521234567890',
        fecha: '2026-08-01',
        horario: '10:00',
        servicioId: undefined,
        monto: 0,
        estado: 'VALIDACION_PENDIENTE',
        origen: 'whatsapp',
      });
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        { waAccessToken: 'wa-token', waPhoneNumberId: '123456' },
        '+521234567890',
        expect.stringContaining('Tu cita ha sido creada'),
      );
    });

    it('should ask for name when agendar has fecha and horario but no nombre', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);
      mockServiciosService.getAll.mockResolvedValue([mockServicio]);
      mockNegocioService.getConfiguracion.mockResolvedValue(mockConfig);
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: '2026-08-01', horario: '10:00' },
      });
      mockCitasService.getSlotDisponibles.mockResolvedValue([]);

      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'AGENDAR',
      });

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.abc',
            type: 'text',
            text: { body: 'A las 10' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        expect.any(Object),
        '+521234567890',
        '¿Cuál es tu nombre para completar la reserva?',
      );
    });

    it('should send error message when createAppointment fails', async () => {
      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);
      mockServiciosService.getAll.mockResolvedValue([mockServicio]);
      mockNegocioService.getConfiguracion.mockResolvedValue(mockConfig);
      mockChatService.findSessionByJid.mockResolvedValue({
        estado: 'CONFIRMANDO_FECHA',
        datos: {
          fecha: '2026-08-01',
          horario: '10:00',
          nombre: 'Juan',
        },
      });
      mockCitasService.getSlotDisponibles.mockResolvedValue([]);
      mockProcesarMensajeConIA.mockResolvedValue({
        intencion: 'AGENDAR',
      });
      mockCitasService.crearCitaAdmin.mockRejectedValue(new Error('DB error'));

      const body = buildPayload({
        messages: [
          {
            from: '+521234567890',
            id: 'wamid.abc',
            type: 'text',
            text: { body: 'Si' },
          },
        ],
      });

      await service.processWhatsAppPayload(body);

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        expect.any(Object),
        '+521234567890',
        expect.stringContaining('hubo un problema'),
      );
    });
  });

  describe('processWhatsAppPayload — status updates', () => {
    it('should update message delivery status', async () => {
      const body = buildPayload({
        statuses: [{ id: 'wamid.abc', status: 'read' }],
      });

      mockNegocioService.findByWaPhoneNumberIdForInternal.mockResolvedValue(mockNegocio);

      await service.processWhatsAppPayload(body);

      expect(mockChatService.updateEstadoEntrega).toHaveBeenCalledWith('wamid.abc', 'read');
    });
  });

  describe('parsearFechaRelativa / formatearFechaEnZona', () => {
    it('should parse relative Spanish dates', () => {
      expect(parsearFechaRelativa('mañana', 'America/La_Paz')).not.toBeNull();
    });

    it('should normalize "manana" without tilde', () => {
      expect(parsearFechaRelativa('manana', 'America/La_Paz')).not.toBeNull();
    });

    it('should return null for unparseable text', () => {
      expect(parsearFechaRelativa('blah blah', 'America/La_Paz')).toBeNull();
    });

    it('should format dates to YYYY-MM-DD in the business timezone', () => {
      const fecha = new Date('2026-08-01T16:00:00.000Z');
      expect(formatearFechaEnZona(fecha, 'America/La_Paz')).toBe('2026-08-01');
    });
  });

  describe('processStripeEvent', () => {
    it('should handle payment_intent.succeeded', async () => {
      const event = {
        id: 'evt_1',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_1',
            amount: 5000,
            currency: 'usd',
            customer: 'cus_1',
            metadata: { negocioId: '1' },
          },
        },
      };

      await expect(service.processStripeEvent(event as never)).resolves.not.toThrow();
    });

    it('should handle invoice.payment_succeeded', async () => {
      const event = {
        id: 'evt_2',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_1',
            amount_paid: 5000,
            currency: 'usd',
            customer: 'cus_1',
          },
        },
      };

      await expect(service.processStripeEvent(event as never)).resolves.not.toThrow();
    });

    it('should handle payment_intent.payment_failed', async () => {
      const event = {
        id: 'evt_3',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_fail',
            amount: 5000,
            currency: 'usd',
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined',
            },
            customer: 'cus_1',
          },
        },
      };

      await expect(service.processStripeEvent(event as never)).resolves.not.toThrow();
    });

    it('should handle unhandled event types without error', async () => {
      const event = {
        id: 'evt_4',
        type: 'customer.subscription.created',
        data: { object: {} },
      };

      await expect(service.processStripeEvent(event as never)).resolves.not.toThrow();
    });
  });
});
