import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SesionChatRepository } from './sesion-chat.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';
import { buildSesionChat, resetIds } from '../__tests__/factories';

describe('SesionChatRepository', () => {
  let repo: SesionChatRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    resetIds();
    prisma = createMockPrisma();
    repo = new SesionChatRepository(prisma as unknown as never);
  });

  describe('findByJid', () => {
    it('should return session when found', async () => {
      const sesion = buildSesionChat(1, { id: 'chat_jid', estado: 'activo' });
      prisma.sesionChat.findFirst.mockResolvedValue(sesion);

      const result = await repo.findByJid('chat_jid', 1);

      expect(prisma.sesionChat.findFirst).toHaveBeenCalledWith({
        where: { id: 'chat_jid', negocioId: 1 },
      });
      expect(result).not.toBeNull();
      expect(result!.id).toBe('chat_jid');
    });

    it('should return null when session not found', async () => {
      prisma.sesionChat.findFirst.mockResolvedValue(null);

      const result = await repo.findByJid('unknown', 1);

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create a new session', async () => {
      const sesion = buildSesionChat(1, { id: 'new_chat', estado: 'activo', datos: {} });
      prisma.sesionChat.upsert.mockResolvedValue(sesion);

      const result = await repo.upsert('new_chat', 1, { estado: 'activo', datos: {} });

      expect(prisma.sesionChat.upsert).toHaveBeenCalled();
      expect(result.id).toBe('new_chat');
    });

    it('should update existing session', async () => {
      const updated = buildSesionChat(1, {
        id: 'existing',
        estado: 'bloqueado',
        datos: { reason: 'spam' },
      });
      prisma.sesionChat.upsert.mockResolvedValue(updated);

      const result = await repo.upsert('existing', 1, {
        estado: 'bloqueado',
        datos: { reason: 'spam' },
      });

      expect(result.estado).toBe('bloqueado');
    });
  });

  describe('deleteInactiveSessions', () => {
    it('should delete sessions older than limitDate', async () => {
      const limit = new Date('2026-01-01');
      prisma.sesionChat.deleteMany.mockResolvedValue({ count: 10 });

      const result = await repo.deleteInactiveSessions(limit);

      expect(prisma.sesionChat.deleteMany).toHaveBeenCalledWith({
        where: { ultimoMensaje: { lt: limit } },
      });
      expect(result).toBe(10);
    });

    it('should return 0 when no inactive sessions', async () => {
      prisma.sesionChat.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repo.deleteInactiveSessions(new Date('2026-01-01'));

      expect(result).toBe(0);
    });
  });
});
