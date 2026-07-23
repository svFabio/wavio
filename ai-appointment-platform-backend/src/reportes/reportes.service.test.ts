import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportesService } from './reportes.service';
import { CitasService } from '../citas/citas.service';

describe('ReportesService', () => {
  let service: ReportesService;
  let mockCitasService: {
    getAgenda: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockCitasService = {
      getAgenda: vi.fn(),
    };
    service = new ReportesService(mockCitasService as unknown as CitasService);
  });

  describe('exportCitasCSV', () => {
    it('should export citas to CSV format', async () => {
      const mockCitas = [
        {
          id: 1,
          fecha: new Date('2025-01-15'),
          horario: '10:00',
          clienteNombre: 'Juan Pérez',
          clienteTelefono: '+521234567890',
          servicio: 'Corte de cabello',
          estado: 'CONFIRMADA',
          monto: 250,
          origen: 'whatsapp',
          staffId: 1,
          creadoEn: new Date('2025-01-10'),
        },
        {
          id: 2,
          fecha: new Date('2025-01-15'),
          horario: '11:00',
          clienteNombre: null,
          clienteTelefono: '+520987654321',
          servicio: 'Barba',
          estado: 'PENDIENTE',
          monto: 100,
          origen: 'manual',
          staffId: null,
          creadoEn: new Date('2025-01-12'),
        },
      ];

      mockCitasService.getAgenda.mockResolvedValue({
        data: mockCitas,
        pagination: { total: 2, totalPages: 1 },
      });

      const csv = await service.exportCitasCSV(1, '2025-01-01', '2025-01-31');

      expect(csv).toContain(
        'ID,Fecha,Horario,Cliente,Teléfono,Servicio,Estado,Monto,Origen,Staff ID,Creado',
      );
      expect(csv).toContain(
        '1,2025-01-15,10:00,Juan Pérez,+521234567890,Corte de cabello,CONFIRMADA,250,whatsapp,1,',
      );
      expect(csv).toContain('2,2025-01-15,11:00,,+520987654321,Barba,PENDIENTE,100,manual,,');
    });
  });

  describe('getResumenMensual', () => {
    it('should calculate monthly summary correctly', async () => {
      const mockCitas = [
        { id: 1, servicio: 'Corte', estado: 'CONFIRMADA', monto: 250 },
        { id: 2, servicio: 'Corte', estado: 'CONFIRMADA', monto: 250 },
        { id: 3, servicio: 'Barba', estado: 'CANCELADA', monto: 100 },
        { id: 4, servicio: 'Corte', estado: 'NO_ASISTIO', monto: 250 },
      ];

      mockCitasService.getAgenda.mockResolvedValue({
        data: mockCitas,
        pagination: { total: 4, totalPages: 1 },
      });

      const resumen = await service.getResumenMensual(1, 2025, 1);

      expect(resumen.totalCitas).toBe(4);
      expect(resumen.confirmadas).toBe(2);
      expect(resumen.canceladas).toBe(1);
      expect(resumen.noShows).toBe(1);
      expect(resumen.ingresos).toBe(500); // 2 confirmed * 250

      expect(resumen.servicios).toHaveLength(2);
      expect(resumen.servicios[0]).toEqual({
        servicio: 'Corte',
        count: 3,
        ingresos: 500,
      });
      expect(resumen.servicios[1]).toEqual({
        servicio: 'Barba',
        count: 1,
        ingresos: 0,
      });
    });

    it('should return empty summary when no citas exist', async () => {
      mockCitasService.getAgenda.mockResolvedValue({
        data: [],
        pagination: { total: 0, totalPages: 0 },
      });

      const resumen = await service.getResumenMensual(1, 2025, 1);

      expect(resumen.totalCitas).toBe(0);
      expect(resumen.confirmadas).toBe(0);
      expect(resumen.canceladas).toBe(0);
      expect(resumen.noShows).toBe(0);
      expect(resumen.ingresos).toBe(0);
      expect(resumen.servicios).toHaveLength(0);
    });
  });
});
