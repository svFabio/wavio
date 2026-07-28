import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfiguracionRepository } from './configuracion.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';

describe('ConfiguracionRepository', () => {
  let prisma: MockPrisma;
  let repo: ConfiguracionRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    repo = new ConfiguracionRepository(prisma as never);
  });

  describe('getOrCreateByNegocioId', () => {
    it('should upsert and return mapped configuracion', async () => {
      const raw = {
        id: 1,
        trigger: '!cita',
        mensajeBienvenida: 'Hola!',
        mensajeConfirmacion: 'OK!',
        qrContenido: 'QR',
        qrFotoUrl: null,
        cobrarAdelanto: true,
        porcentajeAdelanto: 50,
        timezone: 'America/La_Paz',
        chatFlow: [],
        negocioId: 1,
      };
      prisma.configuracion.upsert.mockResolvedValue(raw);

      const result = await repo.getOrCreateByNegocioId(1);

      expect(prisma.configuracion.upsert).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        update: {},
        create: { negocioId: 1 },
      });
      expect(result).toEqual({
        ...raw,
        chatFlow: [],
      });
    });

    it('should map chatFlow from JSON when it is an array', async () => {
      const chatFlow = [
        { id: '1', titulo: 'Step 1', mensaje: 'Hello', tipoInput: 'texto', activo: true },
      ];
      const raw = {
        id: 1,
        trigger: '!cita',
        mensajeBienvenida: 'Hola!',
        mensajeConfirmacion: 'OK!',
        qrContenido: 'QR',
        qrFotoUrl: null,
        cobrarAdelanto: true,
        porcentajeAdelanto: 50,
        timezone: 'America/La_Paz',
        chatFlow,
        negocioId: 1,
      };
      prisma.configuracion.upsert.mockResolvedValue(raw);

      const result = await repo.getOrCreateByNegocioId(1);

      expect(result.chatFlow).toEqual(chatFlow);
    });
  });

  describe('upsert', () => {
    it('should upsert with update data', async () => {
      const raw = {
        id: 1,
        trigger: '!cita',
        mensajeBienvenida: 'Hola!',
        mensajeConfirmacion: 'OK!',
        qrContenido: 'QR',
        qrFotoUrl: null,
        cobrarAdelanto: true,
        porcentajeAdelanto: 50,
        timezone: 'America/La_Paz',
        chatFlow: [],
        negocioId: 1,
      };
      prisma.configuracion.upsert.mockResolvedValue(raw);

      const result = await repo.upsert(1, { trigger: '!nuevo' });

      expect(prisma.configuracion.upsert).toHaveBeenCalledWith({
        where: { negocioId: 1 },
        update: { trigger: '!nuevo' },
        create: { negocioId: 1, trigger: '!nuevo' },
      });
      expect(result).toEqual({
        ...raw,
        chatFlow: [],
      });
    });
  });
});
