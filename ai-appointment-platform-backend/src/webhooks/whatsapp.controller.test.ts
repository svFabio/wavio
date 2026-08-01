import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { WhatsAppController } from './whatsapp.controller';
import { WebhookService } from './webhook.service';
import { WhatsappSignatureGuard } from './whatsapp-signature.guard';
import { ENV_CONFIG } from '../config/config.module';

describe('WhatsAppController', () => {
  let app: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WhatsAppController],
      providers: [
        { provide: WebhookService, useValue: { processWithRetry: vi.fn() } },
        { provide: WhatsappSignatureGuard, useValue: { canActivate: () => true } },
        { provide: ENV_CONFIG, useValue: { META_APP_SECRET: 'test-app-secret' } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('GET /api/v1/webhooks/whatsapp should return challenge when token matches', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/webhooks/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-verify-token', 'hub.challenge': '123456' });
    expect(res.status).toBe(200);
    expect(res.text).toBe('123456');
  });

  it('GET /api/v1/webhooks/whatsapp should return 403 when token does not match', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/webhooks/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong-token', 'hub.challenge': '123456' });
    expect(res.status).toBe(403);
  });

  it('GET /api/v1/webhooks/whatsapp should return 403 when mode is not subscribe', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/webhooks/whatsapp')
      .query({ 'hub.mode': 'unsubscribe', 'hub.verify_token': 'test-verify-token', 'hub.challenge': '123456' });
    expect(res.status).toBe(403);
  });

  it('GET /api/v1/webhooks/whatsapp should return 400 for non-numeric challenge', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/webhooks/whatsapp')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'test-verify-token', 'hub.challenge': 'abc' });
    expect(res.status).toBe(400);
  });
});
