import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientesService } from './clientes.service';
import type { ClientesRepository } from './clientes.repository';
import { NotFoundError, ConflictError } from '../domain/errors';

describe('ClientesService', () => {
  let service: ClientesService;
  let mockRepo: {
    findByNegocioId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findByTelefono: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      findByNegocioId: vi.fn(),
      findById: vi.fn(),
      findByTelefono: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new ClientesService(mockRepo as unknown as ClientesRepository);
  });

  describe('getAll', () => {
    it('should return paginated clients', async () => {
      const result = { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      mockRepo.findByNegocioId.mockResolvedValue(result);

      const response = await service.getAll(1, 1, 50);

      expect(response).toEqual(result);
    });
  });

  describe('getById', () => {
    it('should return client when found', async () => {
      const cliente = { id: 1, negocioId: 1, nombre: 'Juan', telefono: '+521234567890' };
      mockRepo.findById.mockResolvedValue(cliente);

      const result = await service.getById(1, 1);

      expect(result).toEqual(cliente);
    });

    it('should throw NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getById(1, 99)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should throw ConflictError when telefono already exists', async () => {
      mockRepo.findByTelefono.mockResolvedValue({ id: 2, telefono: '+521234567890', negocioId: 1 });

      await expect(
        service.create(1, { nombre: 'Juan', telefono: '+521234567890' }),
      ).rejects.toThrow(ConflictError);
    });

    it('should create client', async () => {
      mockRepo.findByTelefono.mockResolvedValue(null);
      const created = { id: 1, negocioId: 1, nombre: 'Juan', telefono: '+521234567890' };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(1, { nombre: 'Juan', telefono: '+521234567890' });

      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should throw NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update(1, 99, { nombre: 'New' })).rejects.toThrow(NotFoundError);
    });

    it('should update client', async () => {
      const existing = { id: 1, negocioId: 1, nombre: 'Juan', telefono: '+521234567890' };
      mockRepo.findById.mockResolvedValue(existing);
      const updated = { ...existing, nombre: 'Juan Updated' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, { nombre: 'Juan Updated' });

      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundError when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.remove(1, 99)).rejects.toThrow(NotFoundError);
    });

    it('should delete client', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 1,
        negocioId: 1,
        nombre: 'Juan',
        telefono: '+521234567890',
      });

      await service.remove(1, 1);

      expect(mockRepo.delete).toHaveBeenCalledWith(1, 1);
    });
  });
});
