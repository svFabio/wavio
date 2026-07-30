import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIResponseHandlerService } from './ai-response-handler.service';
import type { Negocio, Servicio, Configuracion, Slot } from '../domain/types';
import type { ContextoConversacion } from '../chat/ai-engine';

const { mockEnviarMensaje, mockEnviarImagen } = vi.hoisted(() => ({
  mockEnviarMensaje: vi.fn(),
  mockEnviarImagen: vi.fn(),
}));

vi.mock('../lib/whatsapp', () => ({
  enviarMensaje: mockEnviarMensaje,
  enviarImagen: mockEnviarImagen,
}));

describe('AIResponseHandlerService', () => {
  let service: AIResponseHandlerService;
  let mockCitasService: {
    crearCitaAdmin: ReturnType<typeof vi.fn>;
    getSlotDisponibles: ReturnType<typeof vi.fn>;
  };
  let mockChatService: { findSessionByJid?: ReturnType<typeof vi.fn> };

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

  const waCreds = {
    waAccessToken: 'wa-token',
    waPhoneNumberId: '123456',
  };

  const cached = {
    servicios: [mockServicio],
    config: mockConfig,
  };

  beforeEach(() => {
    mockEnviarMensaje.mockClear();
    mockEnviarImagen.mockClear();
    mockCitasService = {
      crearCitaAdmin: vi.fn(),
      getSlotDisponibles: vi.fn(),
    };
    mockChatService = {};
    service = new AIResponseHandlerService(mockCitasService as any, mockChatService as any);
  });

  describe('handleResponse', () => {
    it('should send suggested response when intencion is not AGENDAR', async () => {
      const contexto: ContextoConversacion = {
        estado: 'INICIO',
        datos: {},
        intentosAclaracion: 0,
      };

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'OTRO', respuestaSugerida: 'Tenemos cortes desde $250' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        'Tenemos cortes desde $250',
      );
    });

    it('should send fallback message when no respuestaSugerida and not AGENDAR', async () => {
      const contexto: ContextoConversacion = {
        estado: 'INICIO',
        datos: {},
        intentosAclaracion: 0,
      };

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'OTRO' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        'He recibido tu mensaje.',
      );
    });

    it('should proceed with agendar flow when AGENDAR and CONFIRMANDO_FECHA', async () => {
      const contexto: ContextoConversacion = {
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: new Date('2026-08-01'), horario: '10:00', nombre: 'Juan' },
        intentosAclaracion: 0,
      };

      mockCitasService.crearCitaAdmin.mockResolvedValue({ id: 1, monto: 0 });

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

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
    });
  });

  describe('handleResponse — agendar flow with full data', () => {
    let contexto: ContextoConversacion;

    beforeEach(() => {
      contexto = {
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: new Date('2026-08-01'), horario: '10:00', nombre: 'Juan' },
        intentosAclaracion: 0,
      };
      mockCitasService.crearCitaAdmin.mockResolvedValue({
        id: 42,
        monto: 0,
      });
    });

    it('should create appointment and send confirmation without payment', async () => {
      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Tu cita ha sido creada'),
      );
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Pendiente de validación'),
      );
      expect(mockEnviarImagen).not.toHaveBeenCalled();
      expect(contexto.estado).toBe('INICIO');
      expect(contexto.datos).toEqual({});
    });

    it('should include payment info and send QR when cobrarAdelanto is true', async () => {
      const configConPago: Configuracion = {
        ...mockConfig,
        cobrarAdelanto: true,
        porcentajeAdelanto: 50,
        qrFotoUrl: 'https://example.com/qr.png',
      };
      mockCitasService.crearCitaAdmin.mockResolvedValue({
        id: 42,
        monto: 1000,
      });

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        { ...cached, config: configConPago },
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Adelanto requerido'),
      );
      expect(mockEnviarImagen).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        'https://example.com/qr.png',
        expect.stringContaining('Escanea este QR'),
      );
    });

    it('should send error message when appointment creation fails', async () => {
      mockCitasService.crearCitaAdmin.mockRejectedValue(new Error('Database error'));

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('hubo un problema'),
      );
    });

    it('should not send QR when qrFotoUrl is null even if cobrarAdelanto is true', async () => {
      const configSinQR: Configuracion = {
        ...mockConfig,
        cobrarAdelanto: true,
        porcentajeAdelanto: 50,
        qrFotoUrl: null,
      };
      mockCitasService.crearCitaAdmin.mockResolvedValue({
        id: 42,
        monto: 1000,
      });

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        { ...cached, config: configSinQR },
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Adelanto requerido'),
      );
      expect(mockEnviarImagen).not.toHaveBeenCalled();
    });
  });

  describe('handleResponse — agendar flow asking for name', () => {
    let contexto: ContextoConversacion;

    beforeEach(() => {
      contexto = {
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: new Date('2026-08-01'), horario: '10:00' },
        intentosAclaracion: 0,
      };
    });

    it('should ask for name when horario exists but no nombre', async () => {
      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        '¿Cuál es tu nombre para completar la reserva?',
      );
      expect(contexto.estado).toBe('ESPERANDO_NOMBRE');
    });
  });

  describe('handleResponse — agendar flow offering time slots', () => {
    let contexto: ContextoConversacion;

    beforeEach(() => {
      contexto = {
        estado: 'CONFIRMANDO_FECHA',
        datos: { fecha: new Date('2026-08-01') },
        intentosAclaracion: 0,
      };
    });

    it('should offer slots when fecha exists and slots are available', async () => {
      const slots: Slot[] = [
        { inicio: '09:00', fin: '10:00', staffId: null },
        { inicio: '10:00', fin: '11:00', staffId: null },
        { inicio: '11:00', fin: '12:00', staffId: null },
      ];
      mockCitasService.getSlotDisponibles.mockResolvedValue(slots);

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockCitasService.getSlotDisponibles).toHaveBeenCalledWith({
        negocioId: 1,
        servicioId: 1,
        fecha: '2026-08-01',
      });
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Horarios disponibles'),
      );
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('09:00'),
      );
      expect(contexto.estado).toBe('ESPERANDO_HORA');
    });

    it('should only show first 5 slots', async () => {
      const slots: Slot[] = Array.from({ length: 7 }, (_, i) => ({
        inicio: `${String(9 + i).padStart(2, '0')}:00`,
        fin: `${String(10 + i).padStart(2, '0')}:00`,
        staffId: null,
      }));
      mockCitasService.getSlotDisponibles.mockResolvedValue(slots);

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('09:00'),
      );
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('13:00'),
      );
      expect(mockEnviarMensaje).not.toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('15:00'),
      );
    });

    it('should show no availability message when no slots exist', async () => {
      mockCitasService.getSlotDisponibles.mockResolvedValue([]);

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('no hay horarios disponibles'),
      );
      expect(contexto.estado).toBe('CONFIRMANDO_FECHA');
    });

    it('should ask for service when no servicios exist', async () => {
      const cachedSinServicio = { servicios: [], config: mockConfig };

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cachedSinServicio,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        '¿Qué servicio deseas agendar?',
      );
      expect(contexto.estado).toBe('ESPERANDO_SERVICIO');
    });

    it('should ask for time when getSlotDisponibles throws', async () => {
      mockCitasService.getSlotDisponibles.mockRejectedValue(new Error('Error'));

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        '¿Para qué hora te gustaría tu cita?',
      );
    });
  });

  describe('handleResponse — agendar flow offering services', () => {
    let contexto: ContextoConversacion;

    beforeEach(() => {
      contexto = {
        estado: 'CONFIRMANDO_FECHA',
        datos: {},
        intentosAclaracion: 0,
      };
    });

    it('should list services when no fecha, horario, or nombre', async () => {
      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cached,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Corte de cabello ($250)'),
      );
    });

    it('should handle multiple servicios in the offer', async () => {
      const contexto: ContextoConversacion = {
        estado: 'CONFIRMANDO_FECHA',
        datos: {},
        intentosAclaracion: 0,
      };
      const cachedMulti = {
        servicios: [
          { ...mockServicio, nombre: 'Corte', precio: 250 },
          { ...mockServicio, id: 2, nombre: 'Barba', precio: 100 },
        ],
        config: mockConfig,
      };

      await service.handleResponse(
        mockNegocio,
        '+521234567890',
        { intencion: 'AGENDAR' },
        contexto,
        cachedMulti,
      );

      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Corte ($250)'),
      );
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        waCreds,
        '+521234567890',
        expect.stringContaining('Barba ($100)'),
      );
    });
  });
});
