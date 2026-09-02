import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SurveyService } from './survey.service';
import type { AppointmentRepository } from '../repositories/appointment.repository';
import type { NegocioService } from '../negocio/negocio.service';
import type { EventsService } from '../events/events.service';

const originalTz = process.env.TZ;

function cita({ id, horario }: { id: number; horario: string }, fechaISO: string) {
  return {
    id,
    clienteNombre: 'Juan',
    clienteTelefono: '+521234567890',
    encuestaEnviada: false,
    negocioId: 1,
    fecha: new Date(fechaISO),
    horario,
  };
}

describe('SurveyService', () => {
  let service: SurveyService;
  let mockAppointmentRepo: {
    findCompletedForSurvey: ReturnType<typeof vi.fn>;
    markSurveySent: ReturnType<typeof vi.fn>;
  };
  let mockNegocio: {
    getActiveBusinessIds: ReturnType<typeof vi.fn>;
    findByIdForInternal: ReturnType<typeof vi.fn>;
    findByIdsForInternal: ReturnType<typeof vi.fn>;
  };
  let mockEvents: { sendWhatsAppMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'));
    mockAppointmentRepo = {
      findCompletedForSurvey: vi.fn(),
      markSurveySent: vi.fn(),
    };
    mockNegocio = {
      getActiveBusinessIds: vi.fn(),
      findByIdForInternal: vi.fn(),
      findByIdsForInternal: vi.fn(),
    };
    mockEvents = { sendWhatsAppMessage: vi.fn() };
    service = new SurveyService(
      mockAppointmentRepo as unknown as AppointmentRepository,
      mockNegocio as unknown as NegocioService,
      mockEvents as unknown as EventsService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTz;
  });

  describe('handleSurveys', () => {
    // Cutoff: now - 24h => 07-27 12:00Z. Only citas before that are eligible.
    it('should do nothing when no businesses', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([]);

      await service.handleSurveys();

      expect(mockAppointmentRepo.findCompletedForSurvey).not.toHaveBeenCalled();
    });

    it('should skip citas after the cutoff', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      // 07-27 13:00Z is after cutoff (12:00Z)
      mockAppointmentRepo.findCompletedForSurvey.mockResolvedValue([
        cita({ id: 1, horario: '13:00' }, '2026-07-27'),
      ]);

      await service.handleSurveys();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
      expect(mockAppointmentRepo.markSurveySent).not.toHaveBeenCalled();
    });

    it('should skip citas where survey already sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      const elegible = cita({ id: 1, horario: '10:00' }, '2026-07-27');
      elegible.encuestaEnviada = true;
      mockAppointmentRepo.findCompletedForSurvey.mockResolvedValue([elegible]);

      await service.handleSurveys();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should skip when negocio has no wa credentials', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findCompletedForSurvey.mockResolvedValue([
        cita({ id: 1, horario: '10:00' }, '2026-07-27'),
      ]);
      mockNegocio.findByIdsForInternal.mockResolvedValue(
        new Map([[1, { waAccessToken: null, waPhoneNumberId: null }]]),
      );

      await service.handleSurveys();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should send survey and mark sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findCompletedForSurvey.mockResolvedValue([
        cita({ id: 1, horario: '10:00' }, '2026-07-27'),
      ]);
      mockNegocio.findByIdsForInternal.mockResolvedValue(
        new Map([[1, { waAccessToken: 'token', waPhoneNumberId: '123' }]]),
      );

      await service.handleSurveys();

      expect(mockEvents.sendWhatsAppMessage).toHaveBeenCalled();
      expect(mockAppointmentRepo.markSurveySent).toHaveBeenCalledWith(1);
    });
  });
});
