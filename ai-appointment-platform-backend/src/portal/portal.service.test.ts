import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortalService } from './portal.service';
import type { PortalRepository } from './portal.repository';
import { NotFoundError, ValidationError } from '../domain/errors';

describe('PortalService', () => {
  let service: PortalService;
  let mockPortalRepository: Record<string, ReturnType<typeof vi.fn>>;

  const validCliente = {
    id: 1,
    nombre: 'Juan Pérez',
    telefono: '+521234567890',
    email: 'juan@test.com',
    magicLinkExpiry: new Date('2027-01-01'),
    negocio: { id: 10, nombre: 'Test Spa' },
  };

  beforeEach(() => {
    mockPortalRepository = {
      findClienteByIdAndNegocio: vi.fn(),
      updateMagicToken: vi.fn(),
      findClienteByMagicToken: vi.fn(),
      findCitasByCliente: vi.fn(),
      checkSlotOccupied: vi.fn(),
      findServicioById: vi.fn(),
      createCita: vi.fn(),
      findServiciosActivos: vi.fn(),
      findHorariosByDia: vi.fn(),
      findCitasOcupadas: vi.fn(),
    };

    service = new PortalService(mockPortalRepository as unknown as PortalRepository);
  });

  /* ─── generateMagicLink ─────────────────────────────────────────── */

  describe('generateMagicLink', () => {
    it('should generate a magic link with UUID token for existing cliente', async () => {
      mockPortalRepository.findClienteByIdAndNegocio.mockResolvedValue({ id: 1 });

      const result = await service.generateMagicLink(10, 1);

      expect(result.url).toContain('/portal/');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(mockPortalRepository.updateMagicToken).toHaveBeenCalledWith(
        1,
        result.token,
        expect.any(Date),
      );
    });

    it('should throw NotFoundError when cliente does not exist', async () => {
      mockPortalRepository.findClienteByIdAndNegocio.mockResolvedValue(null);

      await expect(service.generateMagicLink(10, 999)).rejects.toThrow(NotFoundError);
    });
  });

  /* ─── validateMagicLink ──────────────────────────────────────────── */

  describe('validateMagicLink', () => {
    it('should return cliente and negocio data for valid token', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);

      const result = await service.validateMagicLink('valid-token');

      expect(result.cliente.nombre).toBe('Juan Pérez');
      expect(result.negocio.nombre).toBe('Test Spa');
    });

    it('should throw ValidationError when token is not found', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(null);

      await expect(service.validateMagicLink('invalid-token')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when magic link is expired', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue({
        ...validCliente,
        magicLinkExpiry: new Date('2025-01-01'),
      });

      await expect(service.validateMagicLink('expired-token')).rejects.toThrow(ValidationError);
    });
  });

  /* ─── getClientAppointments ─────────────────────────────────────── */

  describe('getClientAppointments', () => {
    it('should return citas for the validated client', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      const mockCitas = [
        { id: 1, fecha: new Date('2026-08-01'), horario: '10:00', servicio: 'Corte' },
        { id: 2, fecha: new Date('2026-08-05'), horario: '14:00', servicio: 'Barba' },
      ];
      mockPortalRepository.findCitasByCliente.mockResolvedValue(mockCitas);

      const result = await service.getClientAppointments('valid-token');

      expect(result).toHaveLength(2);
      expect(mockPortalRepository.findCitasByCliente).toHaveBeenCalledWith(
        10,
        '+521234567890',
        'Juan Pérez',
      );
    });
  });

  /* ─── getHorariosDisponibles ────────────────────────────────────── */

  describe('getHorariosDisponibles', () => {
    it('should return available slots after removing occupied ones', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockPortalRepository.findHorariosByDia.mockResolvedValue([
        { horaInicio: '09:00', horaFin: '13:00' },
      ]);
      mockPortalRepository.findServicioById.mockResolvedValue(null);
      mockPortalRepository.findCitasOcupadas.mockResolvedValue([
        { horario: '10:00' },
        { horario: '11:00' },
      ]);

      const result = await service.getHorariosDisponibles('valid-token', '2026-07-28');

      expect(result).toContain('09:00');
      expect(result).toContain('12:00');
      expect(result).not.toContain('10:00');
      expect(result).not.toContain('11:00');
    });

    it('should use servicio duration when provided', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockPortalRepository.findHorariosByDia.mockResolvedValue([
        { horaInicio: '09:00', horaFin: '11:00' },
      ]);
      mockPortalRepository.findServicioById.mockResolvedValue({
        id: 5,
        nombre: 'Premium',
        duracionMinutos: 90,
        precio: 500,
      });
      mockPortalRepository.findCitasOcupadas.mockResolvedValue([]);

      const result = await service.getHorariosDisponibles('valid-token', '2026-07-28', 5);

      // 09:00-11:00 with 90min slots: 09:00 only
      expect(result).toEqual(['09:00']);
      expect(mockPortalRepository.findServicioById).toHaveBeenCalledWith(5, 10);
    });
  });

  /* ─── bookAppointmentFromPortal ─────────────────────────────────── */

  describe('bookAppointmentFromPortal', () => {
    it('should create a cita for valid token and slot', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockPortalRepository.checkSlotOccupied.mockResolvedValue(false);
      mockPortalRepository.findServicioById.mockResolvedValue({
        id: 3,
        nombre: 'Corte',
        duracionMinutos: 60,
        precio: 250,
      });

      const result = await service.bookAppointmentFromPortal('valid-token', {
        fecha: '2027-01-15',
        horario: '10:00',
        servicioId: 3,
      });

      expect(result.success).toBe(true);
      expect(mockPortalRepository.createCita).toHaveBeenCalledWith(
        expect.objectContaining({
          negocioId: 10,
          clienteNombre: 'Juan Pérez',
          clienteTelefono: '+521234567890',
          horario: '10:00',
          servicio: 'Corte',
          origen: 'portal',
        }),
      );
    });

    it('should throw ValidationError when fecha is in the past', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);

      await expect(
        service.bookAppointmentFromPortal('valid-token', {
          fecha: '2024-01-01',
          horario: '10:00',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when slot is occupied', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockPortalRepository.checkSlotOccupied.mockResolvedValue(true);

      await expect(
        service.bookAppointmentFromPortal('valid-token', {
          fecha: '2027-01-15',
          horario: '10:00',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should use default duration and price when servicioId is not provided', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockPortalRepository.checkSlotOccupied.mockResolvedValue(false);

      const result = await service.bookAppointmentFromPortal('valid-token', {
        fecha: '2027-01-15',
        horario: '10:00',
      });

      expect(result.success).toBe(true);
      expect(mockPortalRepository.createCita).toHaveBeenCalledWith(
        expect.objectContaining({
          servicio: 'General',
          duracionMinutos: 60,
          monto: 0,
        }),
      );
    });
  });

  /* ─── getServiciosForPortal ──────────────────────────────────────── */

  describe('getServiciosForPortal', () => {
    it('should return active servicios for the validated negocio', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockPortalRepository.findServiciosActivos.mockResolvedValue([
        { id: 1, nombre: 'Corte', duracionMinutos: 60, precio: 250 },
        { id: 2, nombre: 'Barba', duracionMinutos: 30, precio: 100 },
      ]);

      const result = await service.getServiciosForPortal('valid-token');

      expect(result).toHaveLength(2);
      expect(result[0].nombre).toBe('Corte');
    });
  });
});
