import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfiguracionService } from './configuracion.service';
import type { ConfiguracionRepository } from './configuracion.repository';
import { ValidationError } from '../domain/errors';

vi.mock('../lib/cloudinary', () => ({
  uploadBase64Image: vi.fn().mockResolvedValue('https://cloudinary.com/wavio/qr/1/abc123'),
}));

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let mockRepo: {
    getOrCreateByNegocioId: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      getOrCreateByNegocioId: vi.fn(),
      upsert: vi.fn(),
    };
    service = new ConfiguracionService(mockRepo as unknown as ConfiguracionRepository);
  });

  describe('getConfiguracion', () => {
    it('should return config', async () => {
      const config = { id: 1, trigger: '!cita' };
      mockRepo.getOrCreateByNegocioId.mockResolvedValue(config);

      const result = await service.getConfiguracion(1);

      expect(result).toEqual(config);
    });
  });

  describe('updateConfiguracion', () => {
    it('should update only provided fields', async () => {
      const updated = {
        id: 1,
        trigger: '!agendar',
        mensajeBienvenida: 'Hola!',
        cobrarAdelanto: true,
        porcentajeAdelanto: 50,
      };
      mockRepo.upsert.mockResolvedValue(updated);

      const result = await service.updateConfiguracion(1, {
        trigger: '!agendar',
        mensajeBienvenida: 'Hola!',
      });

      expect(result).toEqual(updated);
      expect(mockRepo.upsert).toHaveBeenCalledWith(1, {
        trigger: '!agendar',
        mensajeBienvenida: 'Hola!',
      });
    });

    it('should trim trigger value', async () => {
      mockRepo.upsert.mockResolvedValue({});

      await service.updateConfiguracion(1, { trigger: '  !cita  ' });

      expect(mockRepo.upsert).toHaveBeenCalledWith(1, { trigger: '!cita' });
    });
  });

  describe('uploadQR', () => {
    it('should throw ValidationError when imagen is empty', async () => {
      await expect(service.uploadQR(1, '')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when imagen is not a string', async () => {
      await expect(service.uploadQR(1, null as unknown as string)).rejects.toThrow(ValidationError);
    });

    it('should upload and return QR url', async () => {
      mockRepo.upsert.mockResolvedValue({ qrFotoUrl: 'https://cloudinary.com/wavio/qr/1/abc123' });

      const result = await service.uploadQR(1, 'base64-image-data');

      expect(result).toEqual({ qrFotoUrl: 'https://cloudinary.com/wavio/qr/1/abc123' });
    });
  });
});
