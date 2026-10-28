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

  it('GET /api/v1/health should return status ok and HTTP 200 when healthy', async () => {
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

  it('GET /api/v1/health should return HTTP 503 when db is in error', async () => {
    mockHealthService.check.mockResolvedValue({
      status: 'degraded' as const,
      uptime: 12345,
      db: { status: 'error' as const, latencyMs: 50 },
      redis: { status: 'ok' as const },
      timestamp: '2026-07-28T00:00:00.000Z',
    });
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.db.status).toBe('error');
  });

  it('GET /api/v1/health should return HTTP 503 when status is degraded', async () => {
    mockHealthService.check.mockResolvedValue({
      status: 'degraded' as const,
      uptime: 50,
      db: { status: 'error' as const, latencyMs: 100 },
      redis: { status: 'unavailable' as const },
      timestamp: '2026-07-28T00:00:00.000Z',
    });
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
  });
});
