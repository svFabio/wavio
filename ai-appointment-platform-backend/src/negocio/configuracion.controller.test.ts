import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import { ConfiguracionController } from './configuracion.controller';
import { ConfiguracionService } from './configuracion.service';
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

describe('ConfiguracionController', () => {
  let app: any;
  const mockConfigService = {
    getConfiguracion: vi.fn(),
    updateConfiguracion: vi.fn(),
    uploadQR: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ConfiguracionController],
      providers: [{ provide: ConfiguracionService, useValue: mockConfigService }],
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

  it('GET /api/v1/configuracion should return config', async () => {
    mockConfigService.getConfiguracion.mockResolvedValue({
      trigger: '!cita',
      mensajeBienvenida: 'Hola',
    });
    const res = await request(app.getHttpServer()).get('/api/v1/configuracion');
    expect(res.status).toBe(200);
    expect(res.body.trigger).toBe('!cita');
  });

  it('PATCH /api/v1/configuracion should update config', async () => {
    mockConfigService.updateConfiguracion.mockResolvedValue({ trigger: '!agendar' });
    const res = await request(app.getHttpServer())
      .patch('/api/v1/configuracion')
      .send({ trigger: '!agendar' });
    expect(res.status).toBe(200);
    expect(res.body.trigger).toBe('!agendar');
  });

  it('POST /api/v1/configuracion/qr should upload QR', async () => {
    mockConfigService.uploadQR.mockResolvedValue({
      qrFotoUrl: 'https://res.cloudinary.com/test.jpg',
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/configuracion/qr')
      .send({ imagen: 'data:image/png;base64,abc123' });
    expect(res.status).toBe(201);
    expect(res.body.qrFotoUrl).toContain('cloudinary');
  });
});
