import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatRepository } from './chat.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildMensajeChat, resetIds } from '../__tests__/factories';

describe('ChatRepository', () => {
  let repo: ChatRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new ChatRepository(prisma as unknown as never);
  });

  describe('getUltimoMensajeEntrantePorTelefono', () => {
    it('should return the last incoming message for a phone number', async () => {
      const msg = { remoteJid: '+521234567890@s.whatsapp.net' };
      prisma.mensajeChat.findFirst.mockResolvedValue(msg);

      const result = await repo.getUltimoMensajeEntrantePorTelefono(1, '+521234567890');

      expect(prisma.mensajeChat.findFirst).toHaveBeenCalledWith({
        where: { negocioId: 1, remoteJid: { contains: '+521234567890' }, direccion: 'ENTRANTE' },
        orderBy: { timestamp: 'desc' },
        select: { remoteJid: true },
      });
      expect(result).toEqual(msg);
    });

    it('should return null when no message found', async () => {
      prisma.mensajeChat.findFirst.mockResolvedValue(null);

      const result = await repo.getUltimoMensajeEntrantePorTelefono(1, '+529999999999');

      expect(result).toBeNull();
    });
  });

  describe('getConversaciones', () => {
    it('should return paginated conversations', async () => {
      const countResult = [{ total: 2 }];
      const dataResult = [
        {
          remoteJid: 'jid1@s.whatsapp.net',
          ultimoMensaje: new Date(),
          totalMensajes: 5,
          ultimoContenido: 'Hola',
          ultimaDireccion: 'ENTRANTE',
          clienteNombre: 'Juan',
        },
        {
          remoteJid: 'jid2@s.whatsapp.net',
          ultimoMensaje: new Date(),
          totalMensajes: 3,
          ultimoContenido: 'Gracias',
          ultimaDireccion: 'SALIENTE',
          clienteNombre: null,
        },
      ];

      prisma.$queryRaw.mockResolvedValueOnce(countResult).mockResolvedValueOnce(dataResult);

      const result = await repo.getConversaciones(1, 1, 10);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return empty when no conversations', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

      const result = await repo.getConversaciones(1, 1, 10);

      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('getMensajes', () => {
    it('should return paginated messages for a jid', async () => {
      const mensajes = [
        buildMensajeChat(1, { remoteJid: 'jid1@s.whatsapp.net', contenido: 'Hola' }),
        buildMensajeChat(1, { remoteJid: 'jid1@s.whatsapp.net', contenido: 'Adiós' }),
      ];
      prisma.mensajeChat.findMany.mockResolvedValue(mensajes);
      prisma.mensajeChat.count.mockResolvedValue(2);

      const result = await repo.getMensajes(1, 'jid1@s.whatsapp.net', 1, 50);

      expect(prisma.mensajeChat.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, remoteJid: 'jid1@s.whatsapp.net' },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 50,
      });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should return empty when no messages for jid', async () => {
      prisma.mensajeChat.findMany.mockResolvedValue([]);
      prisma.mensajeChat.count.mockResolvedValue(0);

      const result = await repo.getMensajes(1, 'unknown@s.whatsapp.net', 1, 10);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('createMensaje', () => {
    it('should create and return a mensaje', async () => {
      const msg = buildMensajeChat(1, {
        contenido: 'Nuevo mensaje',
        remoteJid: 'jid@s.whatsapp.net',
      });
      prisma.mensajeChat.create.mockResolvedValue(msg);

      const result = await repo.createMensaje({
        remoteJid: 'jid@s.whatsapp.net',
        contenido: 'Nuevo mensaje',
        direccion: 'ENTRANTE',
        estadoEntrega: 'enviado',
        negocioId: 1,
      });

      expect(prisma.mensajeChat.create).toHaveBeenCalledWith({
        data: {
          remoteJid: 'jid@s.whatsapp.net',
          contenido: 'Nuevo mensaje',
          direccion: 'ENTRANTE',
          estadoEntrega: 'enviado',
          negocioId: 1,
        },
      });
      expect(result.contenido).toBe('Nuevo mensaje');
    });
  });

  describe('updateEstadoEntrega', () => {
    it('should update delivery status by waMessageId', async () => {
      prisma.mensajeChat.updateMany.mockResolvedValue({ count: 1 });

      await repo.updateEstadoEntrega('wa_msg_123', 'entregado');

      expect(prisma.mensajeChat.updateMany).toHaveBeenCalledWith({
        where: { waMessageId: 'wa_msg_123' },
        data: { estadoEntrega: 'entregado' },
      });
    });
  });

  describe('deleteConversacion', () => {
    it('should delete messages and session for a jid', async () => {
      prisma.mensajeChat.deleteMany.mockResolvedValue({ count: 10 });
      prisma.sesionChat.deleteMany.mockResolvedValue({ count: 1 });
      prisma.$transaction.mockResolvedValue([{ count: 10 }, { count: 1 }]);

      const result = await repo.deleteConversacion(1, 'jid@s.whatsapp.net');

      expect(result).toBe(1);
    });
  });
});
