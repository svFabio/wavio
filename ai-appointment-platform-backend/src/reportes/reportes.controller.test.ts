import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const mockAuthGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().usuario = { id: 1, negocioId: 1, rol: 'ADMIN' };
    return true;
  }),
};

const mockTenantGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().negocioId = 1;
    return true;
  }),
};

const mockRolesGuard: CanActivate = {
  canActivate: vi.fn(() => true),
};

describe('ReportesController', () => {
  let app: any;
  const mockReportesService = {
    exportCitasCSV: vi.fn(),
    getResumenMensual: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [{ provide: ReportesService, useValue: mockReportesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('GET /api/v1/reportes/csv should export CSV', async () => {
    mockReportesService.exportCitasCSV.mockResolvedValue('fecha,cliente\n2026-07-01,Juan');
    const res = await request(app.getHttpServer())
      .get('/api/v1/reportes/csv')
      .query({ desde: '2026-07-01', hasta: '2026-07-31' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('fecha,cliente');
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
  });

  it('GET /api/v1/reportes/csv should return 400 for invalid query', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reportes/csv')
      .query({ desde: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('GET /api/v1/reportes/resumen should return summary', async () => {
    mockReportesService.getResumenMensual.mockResolvedValue({
      totalCitas: 10,
      confirmadas: 5,
      canceladas: 2,
      noShows: 1,
      ingresos: 2500,
      servicios: [],
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/reportes/resumen')
      .query({ year: '2026', month: '7' });
    expect(res.status).toBe(200);
    expect(res.body.totalCitas).toBe(10);
  });

  it('GET /api/v1/reportes/resumen should return 400 for invalid query', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reportes/resumen')
      .query({ year: 'abc', month: 'xyz' });
    expect(res.status).toBe(400);
  });
});
