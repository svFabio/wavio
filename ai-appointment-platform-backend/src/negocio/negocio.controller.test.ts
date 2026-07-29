import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import { NegocioController } from './negocio.controller';
import { NegocioService } from './negocio.service';
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

describe('NegocioController', () => {
  let app: any;
  const mockNegocioService = { configurarNegocio: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [NegocioController],
      providers: [{ provide: NegocioService, useValue: mockNegocioService }],
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

  it('PATCH /api/v1/negocio/configurar should configure business', async () => {
    mockNegocioService.configurarNegocio.mockResolvedValue({ id: 1, nombre: 'Mi Spa' });
    const res = await request(app.getHttpServer())
      .patch('/api/v1/negocio/configurar')
      .send({ nombre: 'Mi Spa' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.negocio.nombre).toBe('Mi Spa');
  });

  it('PATCH /api/v1/negocio/configurar should return 400 for missing name', async () => {
    const res = await request(app.getHttpServer()).patch('/api/v1/negocio/configurar').send({});
    expect(res.status).toBe(400);
  });
});
