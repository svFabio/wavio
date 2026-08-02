import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SurveyService } from './survey.service';
import type { AppointmentRepository } from '../repositories/appointment.repository';
import type { NegocioService } from '../negocio/negocio.service';
import type { EventsService } from '../events/events.service';

describe('SurveyService', () => {
  let service: SurveyService;
  let mockAppointmentRepo: {
    findCompletedForSurvey: ReturnType<typeof vi.fn>;
    markSurveySent: ReturnType<typeof vi.fn>;
  };
  let mockNegocio: {
    getActiveBusinessIds: ReturnType<typeof vi.fn>;
    findByIdForInternal: ReturnType<typeof vi.fn>;
  };
  let mockEvents: { sendWhatsAppMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAppointmentRepo = {
      findCompletedForSurvey: vi.fn(),
      markSurveySent: vi.fn(),
    };
    mockNegocio = {
      getActiveBusinessIds: vi.fn(),
      findByIdForInternal: vi.fn(),
    };
    mockEvents = { sendWhatsAppMessage: vi.fn() };
    service = new SurveyService(
      mockAppointmentRepo as unknown as AppointmentRepository,
      mockNegocio as unknown as NegocioService,
      mockEvents as unknown as EventsService,
    );
  });

  describe('handleSurveys', () => {
    it('should do nothing when no businesses', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([]);

      await service.handleSurveys();

      expect(mockAppointmentRepo.findCompletedForSurvey).not.toHaveBeenCalled();
    });

    it('should skip citas where survey already sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findCompletedForSurvey.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          encuestaEnviada: true,
          negocioId: 1,
          fecha: new Date(),
          horario: '10:00',
        },
      ]);

      await service.handleSurveys();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should skip when negocio has no wa credentials', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findCompletedForSurvey.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          encuestaEnviada: false,
          negocioId: 1,
          fecha: new Date(),
          horario: '10:00',
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: null,
        waPhoneNumberId: null,
      });

      await service.handleSurveys();

      expect(mockEvents.sendWhatsAppMessage).not.toHaveBeenCalled();
    });

    it('should send survey and mark sent', async () => {
      mockNegocio.getActiveBusinessIds.mockResolvedValue([1]);
      mockAppointmentRepo.findCompletedForSurvey.mockResolvedValue([
        {
          id: 1,
          clienteNombre: 'Juan',
          clienteTelefono: '+521234567890',
          encuestaEnviada: false,
          negocioId: 1,
          fecha: new Date(),
          horario: '10:00',
        },
      ]);
      mockNegocio.findByIdForInternal.mockResolvedValue({
        waAccessToken: 'token',
        waPhoneNumberId: '123',
      });

      await service.handleSurveys();

      expect(mockEvents.sendWhatsAppMessage).toHaveBeenCalled();
      expect(mockAppointmentRepo.markSurveySent).toHaveBeenCalledWith(1);
    });
  });
});
