import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NegocioService } from './negocio.service';
import type { NegocioRepository } from './negocio.repository';
import type { ConfiguracionService } from './configuracion.service';
import { ValidationError, NotFoundError } from '../domain/errors';

describe('NegocioService', () => {
  let service: NegocioService;
  let mockRepo: {
    findByIdForInternal: ReturnType<typeof vi.fn>;
    findByWaPhoneNumberIdForInternal: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getActiveBusinessIds: ReturnType<typeof vi.fn>;
  };
  let mockConfig: {
    getConfiguracion: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      findByIdForInternal: vi.fn(),
      findByWaPhoneNumberIdForInternal: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      getActiveBusinessIds: vi.fn(),
    };
    mockConfig = { getConfiguracion: vi.fn() };
    service = new NegocioService(
      mockRepo as unknown as NegocioRepository,
      mockConfig as unknown as ConfiguracionService,
    );
  });

  describe('findByIdForInternal', () => {
    it('should return negocio with waAccessToken', async () => {
      const negocio = { id: 1, waAccessToken: 'token' };
      mockRepo.findByIdForInternal.mockResolvedValue(negocio);

      const result = await service.findByIdForInternal(1);

      expect(result).toEqual(negocio);
    });
  });

  describe('findByWaPhoneNumberIdForInternal', () => {
    it('should return negocio by wa phone number', async () => {
      const negocio = { id: 1, waPhoneNumberId: '123' };
      mockRepo.findByWaPhoneNumberIdForInternal.mockResolvedValue(negocio);

      const result = await service.findByWaPhoneNumberIdForInternal('123');

      expect(result).toEqual(negocio);
    });
  });

  describe('getConfiguracion', () => {
    it('should return config from configuracion service', async () => {
      const config = { id: 1, trigger: '!cita' };
      mockConfig.getConfiguracion.mockResolvedValue(config);

      const result = await service.getConfiguracion(1);

      expect(result).toEqual(config);
    });
  });

  describe('configurarNegocio', () => {
    it('should throw ValidationError when name is empty', async () => {
      await expect(service.configurarNegocio(1, '')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name is too short', async () => {
      await expect(service.configurarNegocio(1, 'A')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when negocio does not exist', async () => {
      mockRepo.update.mockResolvedValue(null);

      await expect(service.configurarNegocio(1, 'Mi Spa')).rejects.toThrow(NotFoundError);
    });

    it('should update and return negocio name', async () => {
      const updated = { id: 1, nombre: 'Mi Spa' };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.configurarNegocio(1, '  Mi Spa  ');

      expect(result).toEqual(updated);
      expect(mockRepo.update).toHaveBeenCalledWith(1, { nombre: 'Mi Spa' });
    });
  });

  describe('getWaStatus', () => {
    it('should return connected status', async () => {
      mockRepo.findById.mockResolvedValue({ isWaConnected: true, waPhoneNumberId: '123' });

      const result = await service.getWaStatus(1);

      expect(result).toEqual({ connected: true, phone: '123' });
    });

    it('should return disconnected when negocio is null', async () => {
      mockRepo.findById.mockResolvedValue(null);

      const result = await service.getWaStatus(1);

      expect(result).toEqual({ connected: false, phone: undefined });
    });
  });

  describe('getActiveBusinessIds', () => {
    it('should return active business IDs', async () => {
      mockRepo.getActiveBusinessIds.mockResolvedValue([1, 2, 3]);

      const result = await service.getActiveBusinessIds();

      expect(result).toEqual([1, 2, 3]);
    });
  });
});
