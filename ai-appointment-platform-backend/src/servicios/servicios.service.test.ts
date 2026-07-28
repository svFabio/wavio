import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiciosService } from './servicios.service';
import type { ServiciosRepository } from './servicios.repository';
import { AppError } from '../domain/errors';

describe('ServiciosService', () => {
  let service: ServiciosService;
  let mockRepo: {
    findByNegocioId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      findByNegocioId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    service = new ServiciosService(mockRepo as unknown as ServiciosRepository);
  });

  describe('getAll', () => {
    it('should return all services for a negocio', async () => {
      const servicios = [
        {
          id: 1,
          negocioId: 1,
          nombre: 'Corte',
          duracionMinutos: 60,
          bufferMinutos: 10,
          precio: 250,
          activo: true,
          creadoEn: new Date(),
        },
      ];
      mockRepo.findByNegocioId.mockResolvedValue(servicios);

      const result = await service.getAll(1);

      expect(result).toEqual(servicios);
      expect(mockRepo.findByNegocioId).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a service with defaults for omitted fields', async () => {
      const created = {
        id: 1,
        negocioId: 1,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 0,
        precio: 0,
        activo: true,
        creadoEn: new Date(),
      };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(1, { nombre: 'Corte' });

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith({
        negocioId: 1,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 0,
        precio: 0,
      });
    });
  });

  describe('update', () => {
    it('should throw AppError when service not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update(1, 99, { nombre: 'Nuevo' })).rejects.toThrow(AppError);
    });

    it('should throw AppError when service belongs to different negocio', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 1,
        negocioId: 2,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
        activo: true,
        creadoEn: new Date(),
      });

      await expect(service.update(1, 1, { nombre: 'Nuevo' })).rejects.toThrow(AppError);
    });

    it('should update and return the service', async () => {
      const existing = {
        id: 1,
        negocioId: 1,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
        activo: true,
        creadoEn: new Date(),
      };
      mockRepo.findById.mockResolvedValue(existing);
      const updated = { ...existing, nombre: 'Corte nuevo', precio: 300 };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update(1, 1, { nombre: 'Corte nuevo', precio: 300 });

      expect(result).toEqual(updated);
      expect(mockRepo.update).toHaveBeenCalledWith(1, { nombre: 'Corte nuevo', precio: 300 });
    });
  });

  describe('remove', () => {
    it('should throw AppError when service not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.remove(1, 99)).rejects.toThrow(AppError);
    });

    it('should throw AppError when service belongs to different negocio', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 1,
        negocioId: 2,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
        activo: true,
        creadoEn: new Date(),
      });

      await expect(service.remove(1, 1)).rejects.toThrow(AppError);
    });

    it('should soft-delete the service', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 1,
        negocioId: 1,
        nombre: 'Corte',
        duracionMinutos: 60,
        bufferMinutos: 10,
        precio: 250,
        activo: true,
        creadoEn: new Date(),
      });

      await service.remove(1, 1);

      expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
