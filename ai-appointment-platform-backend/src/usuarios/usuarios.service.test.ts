import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuariosService } from './usuarios.service';
import type { UsuariosRepository } from './usuarios.repository';
import { ValidationError, ConflictError, NotFoundError } from '../domain/errors';

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password') },
}));

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockRepo: {
    findByNegocioId: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    findByIdAndNegocioId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      findByNegocioId: vi.fn(),
      findByEmail: vi.fn(),
      findByIdAndNegocioId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    service = new UsuariosService(mockRepo as unknown as UsuariosRepository);
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const mockData = [
        {
          id: 1,
          nombre: 'Staff 1',
          email: 'staff1@test.com',
          rol: 'STAFF',
          creadoEn: new Date(),
          fotoPerfil: null,
        },
      ];
      mockRepo.findByNegocioId.mockResolvedValue({ data: mockData, total: 1, page: 1, limit: 10 });

      const result = await service.getAllUsers(1, 1, 10);

      expect(result.data).toEqual(mockData);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(mockRepo.findByNegocioId).toHaveBeenCalledWith(1, 1, 10);
    });
  });

  describe('createUser', () => {
    it('should throw ValidationError when required fields are missing', async () => {
      await expect(service.createUser(1, {})).rejects.toThrow(ValidationError);
      await expect(service.createUser(1, { nombre: 'Test' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid role', async () => {
      await expect(
        service.createUser(1, {
          nombre: 'Test',
          email: 'test@test.com',
          password: '123',
          rol: 'OWNER',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError when email already exists', async () => {
      mockRepo.findByEmail.mockResolvedValue({
        id: 2,
        email: 'test@test.com',
        password: 'x',
        rol: 'STAFF',
        fotoPerfil: null,
      });

      await expect(
        service.createUser(1, {
          nombre: 'Test',
          email: 'test@test.com',
          password: '123',
          rol: 'STAFF',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should create user with hashed password', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      const created = {
        id: 1,
        nombre: 'Test',
        email: 'test@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
        fotoPerfil: null,
      };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.createUser(1, {
        nombre: 'Test',
        email: 'test@test.com',
        password: '123',
        rol: 'STAFF',
      });

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Test',
          email: 'test@test.com',
          password: 'hashed_password',
          rol: 'STAFF',
        }),
      );
    });
  });

  describe('updateUser', () => {
    it('should throw NotFoundError when user does not exist', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(null);

      await expect(service.updateUser(1, 99, { nombre: 'New' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when email is taken by another user', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue({
        id: 1,
        nombre: 'Old',
        email: 'old@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockRepo.findByEmail.mockResolvedValue({
        id: 2,
        email: 'taken@test.com',
        password: 'x',
        rol: 'STAFF',
        fotoPerfil: null,
      });

      await expect(service.updateUser(1, 1, { email: 'taken@test.com' })).rejects.toThrow(
        ConflictError,
      );
    });

    it('should throw ValidationError for invalid role', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue({
        id: 1,
        nombre: 'Old',
        email: 'old@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
        fotoPerfil: null,
      });

      await expect(service.updateUser(1, 1, { rol: 'MANAGER' })).rejects.toThrow(ValidationError);
    });

    it('should return existing user when no changes provided', async () => {
      const existing = {
        id: 1,
        nombre: 'Old',
        email: 'old@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
        fotoPerfil: null,
      };
      mockRepo.findByIdAndNegocioId.mockResolvedValue(existing);

      const result = await service.updateUser(1, 1, {});

      expect(result).toEqual(existing);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should update user fields', async () => {
      const existing = {
        id: 1,
        nombre: 'Old',
        email: 'old@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
        fotoPerfil: null,
      };
      mockRepo.findByIdAndNegocioId.mockResolvedValue(existing);
      mockRepo.findByEmail.mockResolvedValue(null);
      const updated = {
        id: 1,
        nombre: 'New',
        email: 'new@test.com',
        rol: 'ADMIN',
        creadoEn: new Date(),
      };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateUser(1, 1, {
        nombre: 'New',
        email: 'new@test.com',
        password: 'newpass',
        rol: 'ADMIN',
      });

      expect(result).toEqual(updated);
    });
  });

  describe('deleteUser', () => {
    it('should throw ValidationError when deleting self', async () => {
      await expect(service.deleteUser(1, 1, 1)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(null);

      await expect(service.deleteUser(1, 2, 1)).rejects.toThrow(NotFoundError);
    });

    it('should delete user', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue({
        id: 2,
        nombre: 'Staff',
        email: 'staff@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
        fotoPerfil: null,
      });

      await service.deleteUser(1, 2, 1);

      expect(mockRepo.delete).toHaveBeenCalledWith(2);
    });
  });
});
