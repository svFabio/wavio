import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let app: any;
  const mockHealthService = { check: vi.fn() };

  beforeEach(async () => {
    mockHealthService.check.mockReset();
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('GET /api/v1/health should return status ok', async () => {
    mockHealthService.check.mockResolvedValue({
      status: 'ok' as const,
      uptime: 12345,
      db: { status: 'ok' as const, latencyMs: 2 },
      redis: { status: 'ok' as const },
      timestamp: '2026-07-28T00:00:00.000Z',
    });
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBe(12345);
  });
});
