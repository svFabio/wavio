import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

const mockAuthGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    req.usuario = { id: 1, negocioId: 1, email: 'test@test.com', rol: 'ADMIN' };
    return true;
  }),
};

const mockTenantGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().negocioId = 1;
    return true;
  }),
};

describe('PushController', () => {
  let app: any;
  const mockPushService = {
    getVapidPublicKey: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [PushController],
      providers: [{ provide: PushService, useValue: mockPushService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('GET /api/v1/push/vapid-public-key should return public key', async () => {
    mockPushService.getVapidPublicKey.mockReturnValue('BPn_abc123');
    const res = await request(app.getHttpServer()).get('/api/v1/push/vapid-public-key');
    expect(res.status).toBe(200);
    expect(res.body.publicKey).toBe('BPn_abc123');
  });

  it('POST /api/v1/push/subscribe should subscribe', async () => {
    mockPushService.subscribe.mockResolvedValue({ id: 1 });
    const res = await request(app.getHttpServer())
      .post('/api/v1/push/subscribe')
      .send({ endpoint: 'https://fcm.test/push', p256dh: 'key123', auth: 'auth123' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });

  it('POST /api/v1/push/subscribe should return 400 for invalid body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/push/subscribe')
      .send({ endpoint: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/v1/push/unsubscribe should unsubscribe', async () => {
    mockPushService.unsubscribe.mockResolvedValue(true);
    const res = await request(app.getHttpServer())
      .delete('/api/v1/push/unsubscribe')
      .send({ endpoint: 'https://fcm.test/push' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
