import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExecutionContext, CanActivate, INestApplication } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

const mockAuthGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().user = { id: 1, negocioId: 10, rol: 'ADMIN' };
    return true;
  }),
};

const mockTenantGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().negocioId = 10;
    return true;
  }),
};

describe('ClientesController', () => {
  let app: INestApplication;
  const mockClientesService = {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [{ provide: ClientesService, useValue: mockClientesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('GET /api/v1/clientes', () => {
    it('should extract page and limit query params and format response via PaginationInterceptor', async () => {
      mockClientesService.getAll.mockResolvedValue({
        data: [{ id: 1, nombre: 'Cliente 1', telefono: '+521234567890' }],
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/clientes?page=2&limit=10')
        .expect(200);

      expect(mockClientesService.getAll).toHaveBeenCalledWith(10, 2, 10);
      expect(res.body).toEqual({
        data: [{ id: 1, nombre: 'Cliente 1', telefono: '+521234567890' }],
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
      });
    });

    it('should use default page=1 and limit=20 when query params are absent', async () => {
      mockClientesService.getAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const res = await request(app.getHttpServer()).get('/api/v1/clientes').expect(200);

      expect(mockClientesService.getAll).toHaveBeenCalledWith(10, 1, 20);
      expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
    });
  });
});
