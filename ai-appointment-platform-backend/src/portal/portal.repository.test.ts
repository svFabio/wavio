import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortalRepository } from './portal.repository';
import { createMockPrisma } from '../__tests__/mocks/prisma';
import type { MockPrisma } from '../__tests__/mocks/prisma';

describe('PortalRepository', () => {
  let repository: PortalRepository;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    repository = new PortalRepository(prisma as never);
  });

  describe('findClienteByMagicToken', () => {
    it('should find a client by magic token', async () => {
      const mockCliente = {
        id: 1,
        nombre: 'Juan Pérez',
        telefono: '+521234567890',
        email: null,
        magicLinkExpiry: new Date('2026-08-10'),
        negocio: { id: 1, nombre: 'Test Spa' },
      };
      prisma.cliente.findUnique.mockResolvedValue(mockCliente);

      const result = await repository.findClienteByMagicToken('token123');

      expect(result).toEqual(mockCliente);
      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { magicToken: 'token123' },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          email: true,
          magicLinkExpiry: true,
          negocio: { select: { id: true, nombre: true } },
        },
      });
    });

    it('should return null when token not found', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      const result = await repository.findClienteByMagicToken('invalid');

      expect(result).toBeNull();
    });
  });

  describe('findClienteByIdAndNegocio', () => {
    it('should find client by id and negocioId', async () => {
      prisma.cliente.findFirst.mockResolvedValue({ id: 1 });

      const result = await repository.findClienteByIdAndNegocio(1, 2);

      expect(result).toEqual({ id: 1 });
      expect(prisma.cliente.findFirst).toHaveBeenCalledWith({
        where: { id: 1, negocioId: 2 },
        select: { id: true },
      });
    });

    it('should return null when client not found', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      const result = await repository.findClienteByIdAndNegocio(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('updateMagicToken', () => {
    it('should update magic token and expiry', async () => {
      const expiry = new Date('2026-08-10');
      prisma.cliente.update.mockResolvedValue({ id: 1 });

      await repository.updateMagicToken(1, 'new-token', expiry);

      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { magicToken: 'new-token', magicLinkExpiry: expiry },
      });
    });

    it('should call prisma.cliente.update once', async () => {
      prisma.cliente.update.mockResolvedValue({ id: 1 });

      await repository.updateMagicToken(1, 'token', new Date('2026-08-10'));

      expect(prisma.cliente.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('findCitasByCliente', () => {
    it('should find citas by telefono or nombre', async () => {
      const mockCitas = [
        {
          id: 1,
          fecha: new Date('2026-08-01'),
          horario: '10:00',
          clienteNombre: 'Juan Pérez',
          clienteTelefono: '+521234567890',
          servicio: 'Corte',
          servicioId: null,
          duracionMinutos: 60,
          staffId: null,
          estadoPago: 'PENDIENTE',
          monto: 250,
          estado: 'PENDIENTE',
          comprobanteUrl: null,
          descripcion: null,
          origen: 'whatsapp',
          recordatorio24h: false,
          recordatorio1h: false,
          encuestaEnviada: false,
          rating: null,
          comentario: null,
          negocioId: 1,
          creadoEn: new Date(),
        },
      ];
      prisma.cita.findMany.mockResolvedValue(mockCitas);

      const result = await repository.findCitasByCliente(1, '+521234567890', 'Juan Pérez');

      expect(result).toHaveLength(1);
      expect(result[0].monto).toBe(250);
      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          OR: [{ clienteTelefono: '+521234567890' }, { clienteNombre: 'Juan Pérez' }],
        },
        orderBy: { fecha: 'desc' },
      });
    });

    it('should convert monto to number', async () => {
      const mockCitas = [
        {
          id: 1,
          fecha: new Date(),
          horario: '10:00',
          clienteNombre: 'Test',
          clienteTelefono: '+521111111111',
          servicio: 'Test',
          servicioId: null,
          duracionMinutos: 30,
          staffId: null,
          estadoPago: 'PAGADO',
          monto: 250,
          estado: 'CONFIRMADA',
          comprobanteUrl: null,
          descripcion: null,
          origen: 'manual',
          recordatorio24h: false,
          recordatorio1h: false,
          encuestaEnviada: false,
          rating: null,
          comentario: null,
          negocioId: 1,
          creadoEn: new Date(),
        },
      ];
      prisma.cita.findMany.mockResolvedValue(mockCitas);

      const result = await repository.findCitasByCliente(1, '+521111111111', 'Test');

      expect(typeof result[0].monto).toBe('number');
    });
  });

  describe('findServiciosActivos', () => {
    it('should return active servicios', async () => {
      const mockServicios = [{ id: 1, nombre: 'Corte', duracionMinutos: 60, precio: 250 }];
      prisma.servicio.findMany.mockResolvedValue(mockServicios);

      const result = await repository.findServiciosActivos(1);

      expect(result).toEqual([{ id: 1, nombre: 'Corte', duracionMinutos: 60, precio: 250 }]);
      expect(prisma.servicio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, activo: true },
        select: { id: true, nombre: true, duracionMinutos: true, precio: true },
        orderBy: { nombre: 'asc' },
      });
    });
  });

  describe('findServicioById', () => {
    it('should return servicio when found', async () => {
      const mockServicio = { id: 1, nombre: 'Corte', duracionMinutos: 60, precio: 250 };
      prisma.servicio.findFirst.mockResolvedValue(mockServicio);

      const result = await repository.findServicioById(1, 1);

      expect(result).toEqual({ ...mockServicio, precio: Number(mockServicio.precio) });
    });

    it('should return null when not found', async () => {
      prisma.servicio.findFirst.mockResolvedValue(null);

      const result = await repository.findServicioById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('findHorariosByDia', () => {
    it('should return horarios for a given day', async () => {
      const mockHorarios = [{ horaInicio: '09:00', horaFin: '18:00' }];
      prisma.horarioNegocio.findMany.mockResolvedValue(mockHorarios);

      const result = await repository.findHorariosByDia(1, 1);

      expect(result).toEqual(mockHorarios);
      expect(prisma.horarioNegocio.findMany).toHaveBeenCalledWith({
        where: { negocioId: 1, diaSemana: 1, activo: true },
        select: { horaInicio: true, horaFin: true },
      });
    });
  });

  describe('findCitasOcupadas', () => {
    it('should return occupied slots', async () => {
      const mockCitas = [{ horario: '10:00' }, { horario: '11:00' }];
      prisma.cita.findMany.mockResolvedValue(mockCitas);

      const result = await repository.findCitasOcupadas(
        1,
        new Date('2026-08-01'),
        new Date('2026-08-01'),
      );

      expect(result).toEqual(mockCitas);
      expect(prisma.cita.findMany).toHaveBeenCalledWith({
        where: {
          negocioId: 1,
          fecha: { gte: new Date('2026-08-01'), lte: new Date('2026-08-01') },
          estado: { not: 'CANCELADA' },
        },
        select: { horario: true },
      });
    });
  });

  describe('checkSlotOccupied', () => {
    it('should return true when slot is occupied', async () => {
      prisma.cita.findFirst.mockResolvedValue({ id: 1 });

      const result = await repository.checkSlotOccupied(1, new Date('2026-08-01'), '10:00');

      expect(result).toBe(true);
    });

    it('should return false when slot is free', async () => {
      prisma.cita.findFirst.mockResolvedValue(null);

      const result = await repository.checkSlotOccupied(1, new Date('2026-08-01'), '10:00');

      expect(result).toBe(false);
    });
  });

  describe('createCita', () => {
    it('should create a cita', async () => {
      const data = {
        negocioId: 1,
        fecha: new Date('2026-08-01'),
        horario: '10:00',
        clienteNombre: 'Juan Pérez',
        clienteTelefono: '+521234567890',
        servicio: 'Corte',
      };
      prisma.cita.create.mockResolvedValue({ id: 1 });

      await repository.createCita(data);

      expect(prisma.cita.create).toHaveBeenCalledWith({ data });
    });
  });
});
