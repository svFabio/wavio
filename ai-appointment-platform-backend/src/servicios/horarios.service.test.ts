import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HorariosService } from './horarios.service';
import type { HorariosNegocioRepository } from './horariosNegocio.repository';
import type { HorariosEspecialesRepository } from './horariosEspeciales.repository';
import type { HorariosStaffRepository } from './horariosStaff.repository';
import { NotFoundError } from '../domain/errors';

describe('HorariosService', () => {
  let service: HorariosService;
  let mockNegocioRepo: {
    findByNegocioId: ReturnType<typeof vi.fn>;
    deleteByNegocioId: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
  let mockEspecialesRepo: {
    findByNegocioId: ReturnType<typeof vi.fn>;
    findByNegocioIdYFecha: ReturnType<typeof vi.fn>;
    deleteById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let mockStaffRepo: {
    findByUsuarioId: ReturnType<typeof vi.fn>;
    deleteByUsuarioId: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    findByNegocioId: ReturnType<typeof vi.fn>;
    getAvailableStaffForSlot: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockNegocioRepo = {
      findByNegocioId: vi.fn(),
      deleteByNegocioId: vi.fn(),
      upsert: vi.fn(),
    };
    mockEspecialesRepo = {
      findByNegocioId: vi.fn(),
      findByNegocioIdYFecha: vi.fn(),
      deleteById: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    };
    mockStaffRepo = {
      findByUsuarioId: vi.fn(),
      deleteByUsuarioId: vi.fn(),
      upsert: vi.fn(),
      findByNegocioId: vi.fn(),
      getAvailableStaffForSlot: vi.fn(),
    };
    service = new HorariosService(
      mockNegocioRepo as unknown as HorariosNegocioRepository,
      mockEspecialesRepo as unknown as HorariosEspecialesRepository,
      mockStaffRepo as unknown as HorariosStaffRepository,
    );
  });

  describe('getHorarios', () => {
    it('should return horarios for negocio', async () => {
      const horarios = [
        { id: 1, negocioId: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', activo: true },
      ];
      mockNegocioRepo.findByNegocioId.mockResolvedValue(horarios);

      const result = await service.getHorarios(1);

      expect(result).toEqual(horarios);
    });
  });

  describe('replaceHorarios', () => {
    it('should delete all and upsert each', async () => {
      const horarios = [
        { diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' },
        { diaSemana: 2, horaInicio: '09:00', horaFin: '18:00' },
      ];
      mockNegocioRepo.upsert.mockResolvedValue({});

      await service.replaceHorarios(1, horarios);

      expect(mockNegocioRepo.deleteByNegocioId).toHaveBeenCalledWith(1);
      expect(mockNegocioRepo.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('getEspeciales', () => {
    it('should return especiales', async () => {
      const especiales = [
        {
          id: 1,
          negocioId: 1,
          fecha: new Date(),
          cerrado: false,
          horaInicio: '10:00',
          horaFin: '16:00',
        },
      ];
      mockEspecialesRepo.findByNegocioId.mockResolvedValue(especiales);

      const result = await service.getEspeciales(1);

      expect(result).toEqual(especiales);
    });
  });

  describe('createEspecial', () => {
    it('should delete existing entry for the same date then create', async () => {
      const existing = {
        id: 5,
        negocioId: 1,
        fecha: new Date('2026-08-01'),
        cerrado: false,
        horaInicio: '10:00',
        horaFin: '16:00',
      };
      mockEspecialesRepo.findByNegocioIdYFecha.mockResolvedValue(existing);
      const created = {
        id: 6,
        negocioId: 1,
        fecha: new Date('2026-08-01'),
        cerrado: true,
        horaInicio: null,
        horaFin: null,
      };
      mockEspecialesRepo.create.mockResolvedValue(created);

      const result = await service.createEspecial(1, {
        fecha: new Date('2026-08-01'),
        cerrado: true,
      });

      expect(mockEspecialesRepo.deleteById).toHaveBeenCalledWith(5);
      expect(result).toEqual(created);
    });

    it('should create when no existing entry', async () => {
      mockEspecialesRepo.findByNegocioIdYFecha.mockResolvedValue(null);
      const created = {
        id: 1,
        negocioId: 1,
        fecha: new Date('2026-08-01'),
        cerrado: false,
        horaInicio: '14:00',
        horaFin: '20:00',
      };
      mockEspecialesRepo.create.mockResolvedValue(created);

      const result = await service.createEspecial(1, {
        fecha: new Date('2026-08-01'),
        cerrado: false,
        horaInicio: '14:00',
        horaFin: '20:00',
      });

      expect(mockEspecialesRepo.deleteById).not.toHaveBeenCalled();
      expect(result).toEqual(created);
    });
  });

  describe('deleteEspecial', () => {
    it('should throw NotFoundError when not found', async () => {
      mockEspecialesRepo.findById.mockResolvedValue(null);

      await expect(service.deleteEspecial(1, 99)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when belongs to different negocio', async () => {
      mockEspecialesRepo.findById.mockResolvedValue({
        id: 1,
        negocioId: 2,
        fecha: new Date(),
        cerrado: false,
        horaInicio: null,
        horaFin: null,
      });

      await expect(service.deleteEspecial(1, 1)).rejects.toThrow(NotFoundError);
    });

    it('should delete and return the especial', async () => {
      const especial = {
        id: 1,
        negocioId: 1,
        fecha: new Date(),
        cerrado: false,
        horaInicio: null,
        horaFin: null,
      };
      mockEspecialesRepo.findById.mockResolvedValue(especial);
      mockEspecialesRepo.deleteById.mockResolvedValue(especial);

      const result = await service.deleteEspecial(1, 1);

      expect(result).toEqual(especial);
    });
  });

  describe('getStaffHorarios', () => {
    it('should return staff horarios', async () => {
      const horarios = [
        { id: 1, usuarioId: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '18:00', activo: true },
      ];
      mockStaffRepo.findByUsuarioId.mockResolvedValue(horarios);

      const result = await service.getStaffHorarios(1);

      expect(result).toEqual(horarios);
    });
  });

  describe('replaceStaffHorarios', () => {
    it('should delete all and upsert each', async () => {
      mockStaffRepo.upsert.mockResolvedValue({});

      await service.replaceStaffHorarios(1, [
        { diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' },
      ]);

      expect(mockStaffRepo.deleteByUsuarioId).toHaveBeenCalledWith(1);
      expect(mockStaffRepo.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStaffHorariosByNegocio', () => {
    it('should delegate to repository', async () => {
      const data = [{ usuarioId: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' }];
      mockStaffRepo.findByNegocioId.mockResolvedValue(data);

      const result = await service.getStaffHorariosByNegocio(1);

      expect(result).toEqual(data);
    });
  });

  describe('getAvailableStaffForSlot', () => {
    it('should return available staff', async () => {
      mockStaffRepo.getAvailableStaffForSlot.mockResolvedValue([1, 2]);

      const result = await service.getAvailableStaffForSlot(1, 1, '10:00');

      expect(result).toEqual([1, 2]);
    });
  });
});
