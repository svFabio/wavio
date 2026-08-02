import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/env', () => ({
  env: {
    LOG_LEVEL: 'info',
    JWT_SECRET: 'test-secret',
    NODE_ENV: 'test',
    PORT: '0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    GEMINI_API_KEY: 'test-gemini-key',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
    META_WEBHOOK_VERIFY_TOKEN: 'test-verify-token',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    META_WHATSAPP_TOKEN: 'test-whatsapp-token',
    META_PHONE_ID: 'test-phone-id',
    META_APP_SECRET: 'test-app-secret',
  },
}));

import { EventsService } from './events.service';
import type { EventsGateway } from './events.gateway';
import type { WhatsAppService } from '../lib/whatsapp.service';

describe('EventsService', () => {
  let service: EventsService;
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockTo: ReturnType<typeof vi.fn>;
  let mockGateway: Partial<EventsGateway>;
  let mockWhatsApp: { sendMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockEmit = vi.fn();
    mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    mockGateway = { server: { to: mockTo } as never };
    mockWhatsApp = { sendMessage: vi.fn() };
    service = new EventsService(
      mockGateway as EventsGateway,
      mockWhatsApp as unknown as WhatsAppService,
    );
  });

  describe('emitCambioCitas', () => {
    it('should emit cambio-citas event to the negocio room', () => {
      service.emitCambioCitas(1, { action: 'update' });

      expect(mockTo).toHaveBeenCalledWith('negocio:1');
      expect(mockEmit).toHaveBeenCalledWith('cambio-citas', { action: 'update' });
    });

    it('should emit without data', () => {
      service.emitCambioCitas(1);

      expect(mockEmit).toHaveBeenCalledWith('cambio-citas', undefined);
    });
  });

  describe('emitNuevaCita', () => {
    it('should emit nueva-cita event to the negocio room', () => {
      service.emitNuevaCita(1, { citaId: 42 });

      expect(mockTo).toHaveBeenCalledWith('negocio:1');
      expect(mockEmit).toHaveBeenCalledWith('nueva-cita', { citaId: 42 });
    });
  });

  describe('emitNuevoMensaje', () => {
    it('should emit nuevo-mensaje event to the negocio room', () => {
      service.emitNuevoMensaje(1, { mensajeId: 'abc' });

      expect(mockTo).toHaveBeenCalledWith('negocio:1');
      expect(mockEmit).toHaveBeenCalledWith('nuevo-mensaje', { mensajeId: 'abc' });
    });
  });

  describe('emitConversacionEliminada', () => {
    it('should emit conversacion-eliminada event to the negocio room', () => {
      service.emitConversacionEliminada(1, { chatId: 'chat_1' });

      expect(mockTo).toHaveBeenCalledWith('negocio:1');
      expect(mockEmit).toHaveBeenCalledWith('conversacion-eliminada', { chatId: 'chat_1' });
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('should send message via WhatsApp service', async () => {
      const waCreds = { waAccessToken: 'token', waPhoneNumberId: '123' };
      mockWhatsApp.sendMessage.mockResolvedValue({ success: true, waMessageId: 'wa_id' });

      await service.sendWhatsAppMessage(waCreds, '+521234567890', 'Hola!');

      expect(mockWhatsApp.sendMessage).toHaveBeenCalledWith(waCreds, '+521234567890', 'Hola!');
    });
  });
});
