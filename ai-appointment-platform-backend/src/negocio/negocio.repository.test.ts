import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NegocioRepository } from './negocio.repository';
import { createMockPrisma, type MockPrisma } from '../__tests__/mocks/prisma';
import { buildNegocio } from '../__tests__/factories';

describe('NegocioRepository', () => {
  let prisma: MockPrisma;
  let repo: NegocioRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    repo = new NegocioRepository(prisma as never);
  });

  describe('findById', () => {
    it('should return negocio when found', async () => {
      const negocio = buildNegocio({ id: 1 });
      prisma.negocio.findUnique.mockResolvedValue(negocio);

      const result = await repo.findById(1);

      expect(prisma.negocio.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
      expect(result).toEqual(negocio);
    });

    it('should return null when not found', async () => {
      prisma.negocio.findUnique.mockResolvedValue(null);

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIdForInternal', () => {
    it('should return negocio with waAccessToken', async () => {
      const negocio = buildNegocio({ id: 1 });
      prisma.negocio.findUnique.mockResolvedValue(negocio);

      const result = await repo.findByIdForInternal(1);

      expect(prisma.negocio.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({ waAccessToken: true }),
      });
      expect(result).toEqual(negocio);
    });
  });

  describe('findByWaPhoneNumberId', () => {
    it('should return negocio with configuracion', async () => {
      const negocio = buildNegocio({ waPhoneNumberId: 'wa-123' });
      prisma.negocio.findUnique.mockResolvedValue(negocio);

      const result = await repo.findByWaPhoneNumberId('wa-123');

      expect(prisma.negocio.findUnique).toHaveBeenCalledWith({
        where: { waPhoneNumberId: 'wa-123' },
        select: expect.objectContaining({ configuracion: true }),
      });
      expect(result).toEqual(negocio);
    });

    it('should return null when not found', async () => {
      prisma.negocio.findUnique.mockResolvedValue(null);

      const result = await repo.findByWaPhoneNumberId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByWaPhoneNumberIdForInternal', () => {
    it('should return negocio with waAccessToken and configuracion', async () => {
      const negocio = buildNegocio({ waPhoneNumberId: 'wa-123', waAccessToken: 'token' });
      prisma.negocio.findUnique.mockResolvedValue(negocio);

      const result = await repo.findByWaPhoneNumberIdForInternal('wa-123');

      expect(prisma.negocio.findUnique).toHaveBeenCalledWith({
        where: { waPhoneNumberId: 'wa-123' },
        select: expect.objectContaining({ waAccessToken: true, configuracion: true }),
      });
      expect(result).toEqual(negocio);
    });
  });

  describe('update', () => {
    it('should update negocio fields', async () => {
      const updated = buildNegocio({ id: 1, nombre: 'Updated Name' });
      prisma.negocio.update.mockResolvedValue(updated);

      const result = await repo.update(1, { nombre: 'Updated Name' });

      expect(prisma.negocio.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nombre: 'Updated Name' },
        select: expect.any(Object),
      });
      expect(result).toEqual(updated);
    });
  });

  describe('getActiveBusinessIds', () => {
    it('should return all negocio ids', async () => {
      prisma.negocio.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await repo.getActiveBusinessIds();

      expect(prisma.negocio.findMany).toHaveBeenCalledWith({ select: { id: true } });
      expect(result).toEqual([1, 2]);
    });

    it('should return empty array when no negocios', async () => {
      prisma.negocio.findMany.mockResolvedValue([]);

      const result = await repo.getActiveBusinessIds();

      expect(result).toEqual([]);
    });
  });
});
