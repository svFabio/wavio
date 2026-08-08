import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service';
import type { ChatRepository } from './chat.repository';
import type { SesionChatRepository } from '../repositories/sesionChat.repository';
import type { NegocioService } from '../negocio/negocio.service';
import type { EventsService } from '../events/events.service';
import { ValidationError, AppError } from '../domain/errors';

vi.hoisted(() => {
  process.env.LOG_LEVEL = 'fatal';
});

const mockEnviarMensaje = vi.hoisted(() => vi.fn());
const mockResolverTelefonoReal = vi.hoisted(() => vi.fn((jid: string) => jid.split('@')[0]));

vi.mock('../lib/whatsapp', () => ({
  enviarMensaje: mockEnviarMensaje,
  resolverTelefonoReal: mockResolverTelefonoReal,
}));

describe('ChatService', () => {
  let service: ChatService;
  let mockChatRepository: Record<string, ReturnType<typeof vi.fn>>;
  let mockSesionChatRepository: Record<string, ReturnType<typeof vi.fn>>;
  let mockNegocioService: Record<string, ReturnType<typeof vi.fn>>;
  let mockEventsService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    mockChatRepository = {
      getConversaciones: vi.fn(),
      getMensajes: vi.fn(),
      createMensaje: vi.fn(),
      updateEstadoEntrega: vi.fn(),
      deleteConversacion: vi.fn(),
      getUltimoMensajeEntrantePorTelefono: vi.fn(),
    };

    mockSesionChatRepository = {
      findByJid: vi.fn(),
      upsert: vi.fn(),
    };

    mockNegocioService = {
      findByIdForInternal: vi.fn(),
    };

    mockEventsService = {
      emitConversacionEliminada: vi.fn(),
    };

    service = new ChatService(
      mockChatRepository as unknown as ChatRepository,
      mockSesionChatRepository as unknown as SesionChatRepository,
      mockNegocioService as unknown as NegocioService,
      mockEventsService as unknown as EventsService,
    );

    mockEnviarMensaje.mockReset();
  });

  /* ─── getConversaciones ─────────────────────────────────────────── */

  describe('getConversaciones', () => {
    it('should return paginated conversations with telefonoReal', async () => {
      mockChatRepository.getConversaciones.mockResolvedValue({
        data: [
          {
            remoteJid: '+521234567890@s.whatsapp.net',
            ultimoMensaje: new Date(),
            totalMensajes: 5,
            ultimoContenido: 'Hola',
            ultimaDireccion: 'ENTRANTE',
            clienteNombre: 'Juan',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await service.getConversaciones(1, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].telefonoReal).toBe('+521234567890');
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  /* ─── getMensajes ────────────────────────────────────────────────── */

  describe('getMensajes', () => {
    it('should return paginated messages', async () => {
      mockChatRepository.getMensajes.mockResolvedValue({
        data: [
          {
            id: 1,
            contenido: 'Hola',
            direccion: 'ENTRANTE',
            remoteJid: 'jid',
            waMessageId: null,
            estadoEntrega: 'enviado',
            timestamp: new Date(),
            negocioId: 1,
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
      });

      const result = await service.getMensajes(1, 'jid', 1, 50);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  /* ─── sendMensaje ────────────────────────────────────────────────── */

  describe('sendMensaje', () => {
    const jid = '+521234567890@s.whatsapp.net';

    it('should send message via WhatsApp and persist it', async () => {
      mockNegocioService.findByIdForInternal.mockResolvedValue({
        id: 1,
        waAccessToken: 'wa_token',
        waPhoneNumberId: 'phone_id',
        googleId: 'g',
        email: 'n@n.com',
        nombre: 'N',
        plan: 'FREE',
        waWabaId: null,
        waAppId: null,
        isWaConnected: true,
        creadoEn: new Date(),
      });
      mockEnviarMensaje.mockResolvedValue({ success: true, waMessageId: 'wamid_abc' });
      mockChatRepository.createMensaje.mockResolvedValue({
        id: 1,
        contenido: 'Hola',
        remoteJid: jid,
        direccion: 'SALIENTE',
        waMessageId: 'wamid_abc',
        estadoEntrega: 'enviado',
        timestamp: new Date(),
        negocioId: 1,
      });

      const result = await service.sendMensaje(1, jid, 'Hola');

      expect(result.success).toBe(true);
      expect(mockEnviarMensaje).toHaveBeenCalledWith(
        { waAccessToken: 'wa_token', waPhoneNumberId: 'phone_id' },
        jid,
        'Hola',
      );
      expect(mockChatRepository.createMensaje).toHaveBeenCalledWith(
        expect.objectContaining({
          remoteJid: jid,
          contenido: 'Hola',
          direccion: 'SALIENTE',
          waMessageId: 'wamid_abc',
        }),
      );
    });

    it('should throw ValidationError when texto is empty', async () => {
      await expect(service.sendMensaje(1, jid, '')).rejects.toThrow(ValidationError);
    });

    it('should throw AppError when WhatsApp is not connected', async () => {
      mockNegocioService.findByIdForInternal.mockResolvedValue(null);

      await expect(service.sendMensaje(1, jid, 'Hola')).rejects.toThrow(AppError);
    });
  });

  /* ─── deleteConversacion ────────────────────────────────────────── */

  describe('deleteConversacion', () => {
    it('should delete conversation and emit socket event', async () => {
      mockChatRepository.deleteConversacion.mockResolvedValue(10);

      const result = await service.deleteConversacion(1, 'jid');

      expect(result.success).toBe(true);
      expect(result.eliminados).toBe(10);
      expect(mockEventsService.emitConversacionEliminada).toHaveBeenCalledWith(1, {
        remoteJid: 'jid',
      });
    });

    it('should not throw when socket emit fails', async () => {
      mockChatRepository.deleteConversacion.mockResolvedValue(5);
      mockEventsService.emitConversacionEliminada.mockImplementation(() => {
        throw new Error('Socket disconnected');
      });

      const result = await service.deleteConversacion(1, 'jid');

      expect(result.success).toBe(true);
      expect(result.eliminados).toBe(5);
    });
  });

  /* ─── findSessionByJid ──────────────────────────────────────────── */

  describe('findSessionByJid', () => {
    it('should return session with safe datos when found', async () => {
      mockSesionChatRepository.findByJid.mockResolvedValue({
        id: 'jid',
        estado: 'activo',
        datos: { paso: 'saludo' },
        ultimoMensaje: new Date(),
        negocioId: 1,
      });

      const result = await service.findSessionByJid('jid', 1);

      expect(result).not.toBeNull();
      expect(result!.datos).toEqual({ paso: 'saludo' });
    });

    it('should return null when no session exists', async () => {
      mockSesionChatRepository.findByJid.mockResolvedValue(null);

      const result = await service.findSessionByJid('jid', 1);

      expect(result).toBeNull();
    });

    it('should handle datos being a non-object value', async () => {
      mockSesionChatRepository.findByJid.mockResolvedValue({
        id: 'jid',
        estado: 'activo',
        datos: 'string_val',
        ultimoMensaje: new Date(),
        negocioId: 1,
      });

      const result = await service.findSessionByJid('jid', 1);

      expect(result!.datos).toEqual({});
    });
  });

  /* ─── upsertSession ──────────────────────────────────────────────── */

  describe('upsertSession', () => {
    it('should delegate to sesionChatRepository', async () => {
      await service.upsertSession('jid', 1, { estado: 'activo', datos: { foo: 'bar' } });

      expect(mockSesionChatRepository.upsert).toHaveBeenCalledWith('jid', 1, {
        estado: 'activo',
        datos: { foo: 'bar' },
      });
    });
  });

  /* ─── Delegating methods ──────────────────────────────────────────── */

  describe('createMensaje', () => {
    it('should delegate to chatRepository', async () => {
      const data = {
        remoteJid: 'jid',
        contenido: 'test',
        direccion: 'ENTRANTE' as const,
        waMessageId: null,
        estadoEntrega: 'enviado',
        negocioId: 1,
      };
      mockChatRepository.createMensaje.mockResolvedValue({ ...data, id: 1, timestamp: new Date() });

      const result = await service.createMensaje(data);

      expect(mockChatRepository.createMensaje).toHaveBeenCalledWith(data);
      expect(result.remoteJid).toBe('jid');
    });
  });

  describe('updateEstadoEntrega', () => {
    it('should delegate to chatRepository', async () => {
      await service.updateEstadoEntrega('wamid_1', 'leido');

      expect(mockChatRepository.updateEstadoEntrega).toHaveBeenCalledWith('wamid_1', 'leido');
    });
  });

  describe('getUltimoMensajeEntrantePorTelefono', () => {
    it('should delegate to chatRepository', async () => {
      mockChatRepository.getUltimoMensajeEntrantePorTelefono.mockResolvedValue({
        remoteJid: 'jid',
      });

      const result = await service.getUltimoMensajeEntrantePorTelefono(1, '123');

      expect(result?.remoteJid).toBe('jid');
    });
  });
});
