import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExecutionContext, CanActivate, INestApplication } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const mockAuthGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().user = { id: 1, negocioId: 10, rol: 'ADMIN' };
    return true;
  }),
};

const mockTenantGuard: CanActivate = {
  canActivate: vi.fn((ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().negocioId = 10;
    ctx.switchToHttp().getRequest().user = { id: 1, negocioId: 10, rol: 'ADMIN' };
    return true;
  }),
};

const mockRolesGuard: CanActivate = {
  canActivate: vi.fn(() => true),
};

describe('UsuariosController', () => {
  let app: INestApplication;
  const mockUsuariosService = {
    getAllUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [{ provide: UsuariosService, useValue: mockUsuariosService }],
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

  describe('GET /api/v1/usuarios', () => {
    it('should extract page and limit query params via PaginationInterceptor', async () => {
      mockUsuariosService.getAllUsers.mockResolvedValue({
        data: [{ id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'ADMIN' }],
        pagination: { page: 2, limit: 15, total: 30, totalPages: 2 },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/usuarios?page=2&limit=15')
        .expect(200);

      expect(mockUsuariosService.getAllUsers).toHaveBeenCalledWith(10, 2, 15);
      expect(res.body).toEqual({
        data: [{ id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'ADMIN' }],
        pagination: { page: 2, limit: 15, total: 30, totalPages: 2 },
      });
    });

    it('should use default page=1 and limit=20 when query params are absent', async () => {
      mockUsuariosService.getAllUsers.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const res = await request(app.getHttpServer()).get('/api/v1/usuarios').expect(200);

      expect(mockUsuariosService.getAllUsers).toHaveBeenCalledWith(10, 1, 20);
      expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
    });
  });
});
