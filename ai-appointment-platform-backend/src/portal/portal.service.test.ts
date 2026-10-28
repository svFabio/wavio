import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortalService } from './portal.service';
import type { PortalRepository } from './portal.repository';
import type { CitasService } from '../citas/citas.service';
import { NotFoundError, ValidationError, ConflictError } from '../domain/errors';

describe('PortalService', () => {
  let service: PortalService;
  let mockPortalRepository: Record<string, ReturnType<typeof vi.fn>>;
  let mockCitasService: Record<string, ReturnType<typeof vi.fn>>;

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

    mockCitasService = {
      getHorariosDisponibles: vi.fn(),
      crearCitaAdmin: vi.fn(),
    };

    service = new PortalService(
      mockPortalRepository as unknown as PortalRepository,
      mockCitasService as unknown as CitasService,
    );
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
    it('should delegate to citasService.getHorariosDisponibles', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockCitasService.getHorariosDisponibles.mockResolvedValue(['09:00', '10:00', '11:00']);

      const result = await service.getHorariosDisponibles('valid-token', '2026-07-28', 5);

      expect(mockCitasService.getHorariosDisponibles).toHaveBeenCalledWith(10, '2026-07-28', 5);
      expect(result).toEqual(['09:00', '10:00', '11:00']);
    });
  });

  /* ─── bookAppointmentFromPortal ─────────────────────────────────── */

  describe('bookAppointmentFromPortal', () => {
    it('should delegate appointment creation to citasService.crearCitaAdmin', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockCitasService.crearCitaAdmin.mockResolvedValue({
        id: 1,
        negocioId: 10,
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '+521234567890',
        horario: '10:00',
        servicio: 'Corte',
        monto: 250,
      });

      const result = await service.bookAppointmentFromPortal('valid-token', {
        fecha: '2027-01-15',
        horario: '10:00',
        servicioId: 3,
      });

      expect(result.success).toBe(true);
      expect(mockCitasService.crearCitaAdmin).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          clienteNombre: 'Juan Pérez',
          clienteTelefono: '+521234567890',
          fecha: '2027-01-15',
          horario: '10:00',
          servicioId: 3,
          estado: 'PENDIENTE',
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

    it('should throw ConflictError when citasService returns null', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockCitasService.crearCitaAdmin.mockResolvedValue(null);

      await expect(
        service.bookAppointmentFromPortal('valid-token', {
          fecha: '2027-01-15',
          horario: '10:00',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should propagate ConflictError when citasService throws ConflictError', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockCitasService.crearCitaAdmin.mockRejectedValue(
        new ConflictError('Ese horario ya fue reservado por otro cliente'),
      );

      await expect(
        service.bookAppointmentFromPortal('valid-token', {
          fecha: '2027-01-15',
          horario: '10:00',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should allow booking when servicioId is not provided', async () => {
      mockPortalRepository.findClienteByMagicToken.mockResolvedValue(validCliente);
      mockCitasService.crearCitaAdmin.mockResolvedValue({
        id: 2,
        negocioId: 10,
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '+521234567890',
        horario: '10:00',
        servicioId: null,
      });

      const result = await service.bookAppointmentFromPortal('valid-token', {
        fecha: '2027-01-15',
        horario: '10:00',
      });

      expect(result.success).toBe(true);
      expect(mockCitasService.crearCitaAdmin).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          clienteNombre: 'Juan Pérez',
          clienteTelefono: '+521234567890',
          fecha: '2027-01-15',
          horario: '10:00',
          servicioId: undefined,
          estado: 'PENDIENTE',
          origen: 'portal',
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
