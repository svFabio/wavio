import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatisticsService } from './statistics.service';
import type { StatisticsRepository } from './statistics.repository';
import { ValidationError } from '../domain/errors';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockRepo: {
    countCitasMes: ReturnType<typeof vi.fn>;
    getCitasConfirmadasMonto: ReturnType<typeof vi.fn>;
    getTopClientes: ReturnType<typeof vi.fn>;
    getHorariosPopulares: ReturnType<typeof vi.fn>;
    getRatingPromedio: ReturnType<typeof vi.fn>;
    getUltimosComentarios: ReturnType<typeof vi.fn>;
    countCitasPorOrigen: ReturnType<typeof vi.fn>;
    getCitasIngresos: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      countCitasMes: vi.fn(),
      getCitasConfirmadasMonto: vi.fn(),
      getTopClientes: vi.fn(),
      getHorariosPopulares: vi.fn(),
      getRatingPromedio: vi.fn(),
      getUltimosComentarios: vi.fn(),
      countCitasPorOrigen: vi.fn(),
      getCitasIngresos: vi.fn(),
    };
    service = new StatisticsService(mockRepo as unknown as StatisticsRepository);
  });

  describe('getOverview', () => {
    it('should aggregate all stats', async () => {
      mockRepo.countCitasMes.mockResolvedValue(10);
      mockRepo.getCitasConfirmadasMonto.mockResolvedValue([
        { monto: { toString: () => '250' } as unknown as number },
        { monto: { toString: () => '150' } as unknown as number },
      ]);
      mockRepo.getTopClientes.mockResolvedValue([
        { clienteTelefono: '+521234567890', clienteNombre: 'Juan', totalCitas: 5 },
      ]);
      mockRepo.getHorariosPopulares.mockResolvedValue([{ horario: '10:00', _count: { id: 8 } }]);
      mockRepo.getRatingPromedio.mockResolvedValue(4.5);
      mockRepo.getUltimosComentarios.mockResolvedValue([
        { clienteNombre: 'Juan', rating: 5, comentario: 'Excelente', fecha: new Date() },
      ]);
      mockRepo.countCitasPorOrigen.mockResolvedValueOnce(3).mockResolvedValueOnce(7);

      const result = await service.getOverview(1);

      expect(result).toMatchObject({
        citasMes: 10,
        ingresosMes: 400,
        topClientes: [{ nombre: 'Juan', telefono: '+521234567890', totalCitas: 5 }],
        horariosPopulares: [{ horario: '10:00', totalReservas: 8 }],
        ratingPromedio: 4.5,
        ultimosComentarios: [{ clienteNombre: 'Juan', rating: 5, comentario: 'Excelente' }],
        citasVirtuales: 3,
        citasPresenciales: 7,
      });
    });
  });

  describe('getRevenue', () => {
    it('should throw ValidationError for invalid months', async () => {
      await expect(service.getRevenue(1, 0)).rejects.toThrow(ValidationError);
      await expect(service.getRevenue(1, 121)).rejects.toThrow(ValidationError);
    });

    it('should return revenue data', async () => {
      const revenueData = [
        { mes: '2026-01', total: 1000 },
        { mes: '2026-02', total: 1500 },
      ];
      mockRepo.getCitasIngresos.mockResolvedValue(revenueData);

      const result = await service.getRevenue(1, 3);

      expect(result).toEqual({ revenue: revenueData });
    });
  });
});
