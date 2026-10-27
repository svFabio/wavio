import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvailabilityService } from './availability.service';
import type { AvailabilityRepository } from './availability.repository';
import { ValidationError } from '../domain/errors';

describe('AvailabilityService', () => {
  let mockRepo: Record<string, ReturnType<typeof vi.fn>>;
  let service: AvailabilityService;

  beforeEach(() => {
    mockRepo = {
      findServicio: vi.fn().mockResolvedValue({
        id: 1,
        negocioId: 1,
        nombre: 'Corte',
        duracionMinutos: 30,
        bufferMinutos: 0,
        precio: 50,
        activo: true,
      }),
      findHorarioEspecial: vi.fn().mockResolvedValue(null),
      findHorariosNegocio: vi.fn().mockResolvedValue([
        {
          id: 1,
          negocioId: 1,
          diaSemana: 0,
          horaInicio: '09:00',
          horaFin: '11:00',
          activo: true,
        },
      ]),
      findHorarioStaff: vi.fn().mockResolvedValue(null),
      findCitasDelDia: vi.fn().mockResolvedValue([]),
    };
    service = new AvailabilityService(mockRepo as unknown as AvailabilityRepository);
  });

  it('throws ValidationError for invalid date format', async () => {
    await expect(
      service.getSlotsDisponibles({
        negocioId: 1,
        servicioId: 1,
        fecha: '25-10-2026',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError if service is not found', async () => {
    mockRepo.findServicio.mockResolvedValue(null);
    await expect(
      service.getSlotsDisponibles({
        negocioId: 1,
        servicioId: 999,
        fecha: '2026-10-25',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('returns empty array if business has closed special schedule', async () => {
    mockRepo.findHorarioEspecial.mockResolvedValue({
      id: 1,
      negocioId: 1,
      cerrado: true,
      horaInicio: null,
      horaFin: null,
    });

    const slots = await service.getSlotsDisponibles({
      negocioId: 1,
      servicioId: 1,
      fecha: '2026-10-25',
    });

    expect(slots).toEqual([]);
  });

  it('generates valid slots from business regular schedule', async () => {
    const slots = await service.getSlotsDisponibles({
      negocioId: 1,
      servicioId: 1,
      fecha: '2026-10-25',
    });

    expect(slots).toHaveLength(4);
    expect(slots.map((s) => s.inicio)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('excludes occupied appointment slots', async () => {
    mockRepo.findCitasDelDia.mockResolvedValue([
      {
        id: 10,
        horario: '09:30',
        duracionMinutos: 30,
      },
    ]);

    const slots = await service.getSlotsDisponibles({
      negocioId: 1,
      servicioId: 1,
      fecha: '2026-10-25',
    });

    expect(slots.map((s) => s.inicio)).toEqual(['09:00', '10:00', '10:30']);
  });

  it('filters out past slots when date is today', async () => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    mockRepo.findHorariosNegocio.mockResolvedValue([
      { id: 1, negocioId: 1, diaSemana: 0, horaInicio: '00:00', horaFin: '23:59', activo: true },
    ]);

    const slots = await service.getSlotsDisponibles({
      negocioId: 1,
      servicioId: 1,
      fecha: today,
    });

    // Slots must not include times in the past in the business timezone
    const timeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/La_Paz',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const ahoraH = Number(timeParts.find((p) => p.type === 'hour')?.value ?? '0');
    const ahoraM = Number(timeParts.find((p) => p.type === 'minute')?.value ?? '0');
    const nowMinutes = ahoraH * 60 + ahoraM;

    for (const slot of slots) {
      const [h, m] = slot.inicio.split(':').map(Number);
      expect(h * 60 + m).toBeGreaterThan(nowMinutes);
    }
  });
});
