import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuariosService } from './usuarios.service';
import type { UsuariosRepository } from './usuarios.repository';
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from '../domain/errors';

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
    countAdminsByNegocio: ReturnType<typeof vi.fn>;
  };

  const staffTarget = {
    id: 2,
    nombre: 'Staff',
    email: 'staff@test.com',
    rol: 'STAFF',
    creadoEn: new Date(),
    fotoPerfil: null,
  };
  const adminTarget = {
    id: 2,
    nombre: 'Admin',
    email: 'admin@test.com',
    rol: 'ADMIN',
    creadoEn: new Date(),
    fotoPerfil: null,
  };
  const ownerTarget = {
    id: 2,
    nombre: 'Owner',
    email: 'owner@test.com',
    rol: 'OWNER',
    creadoEn: new Date(),
    fotoPerfil: null,
  };

  beforeEach(() => {
    mockRepo = {
      findByNegocioId: vi.fn(),
      findByEmail: vi.fn(),
      findByIdAndNegocioId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countAdminsByNegocio: vi.fn(),
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
      await expect(service.createUser(1, {}, 'OWNER')).rejects.toThrow(ValidationError);
      await expect(service.createUser(1, { nombre: 'Test' }, 'OWNER')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for invalid role', async () => {
      await expect(
        service.createUser(
          1,
          {
            nombre: 'Test',
            email: 'test@test.com',
            password: '123',
            rol: 'OWNER',
          },
          'OWNER',
        ),
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
        service.createUser(
          1,
          {
            nombre: 'Test',
            email: 'test@test.com',
            password: '123',
            rol: 'STAFF',
          },
          'OWNER',
        ),
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

      const result = await service.createUser(
        1,
        {
          nombre: 'Test',
          email: 'test@test.com',
          password: '123',
          rol: 'STAFF',
        },
        'OWNER',
      );

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

    it('should throw ForbiddenError when ADMIN tries to create an ADMIN', async () => {
      await expect(
        service.createUser(
          1,
          {
            nombre: 'Test',
            email: 'test@test.com',
            password: '123',
            rol: 'ADMIN',
          },
          'ADMIN',
        ),
      ).rejects.toThrow(ForbiddenError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('should allow OWNER to create an ADMIN', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      const created = {
        id: 1,
        nombre: 'Test',
        email: 'test@test.com',
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.createUser(
        1,
        {
          nombre: 'Test',
          email: 'test@test.com',
          password: '123',
          rol: 'ADMIN',
        },
        'OWNER',
      );

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'ADMIN' }));
    });

    it('should throw ForbiddenError when STAFF tries to create a user', async () => {
      await expect(
        service.createUser(
          1,
          {
            nombre: 'Test',
            email: 'test@test.com',
            password: '123',
            rol: 'STAFF',
          },
          'STAFF',
        ),
      ).rejects.toThrow(ForbiddenError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should throw NotFoundError when user does not exist', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(null);

      await expect(service.updateUser(1, 99, { nombre: 'New' }, 'OWNER')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ConflictError when email is taken by another user', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(staffTarget);
      mockRepo.findByEmail.mockResolvedValue({
        id: 3,
        email: 'taken@test.com',
        password: 'x',
        rol: 'STAFF',
        fotoPerfil: null,
      });

      await expect(service.updateUser(1, 1, { email: 'taken@test.com' }, 'OWNER')).rejects.toThrow(
        ConflictError,
      );
    });

    it('should throw ValidationError for invalid role', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(staffTarget);

      await expect(service.updateUser(1, 1, { rol: 'MANAGER' }, 'OWNER')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should return existing user when no changes provided', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(staffTarget);

      const result = await service.updateUser(1, 1, {}, 'OWNER');

      expect(result).toEqual(staffTarget);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should update user fields', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(staffTarget);
      mockRepo.findByEmail.mockResolvedValue(null);
      const updated = {
        id: 1,
        nombre: 'New',
        email: 'new@test.com',
        rol: 'ADMIN',
        creadoEn: new Date(),
      };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateUser(
        1,
        1,
        {
          nombre: 'New',
          email: 'new@test.com',
          password: 'newpass',
          rol: 'ADMIN',
        },
        'OWNER',
      );

      expect(result).toEqual(updated);
    });

    it('should throw ForbiddenError when ADMIN tries to demote an ADMIN', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);

      await expect(service.updateUser(1, 2, { rol: 'STAFF' }, 'ADMIN')).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when ADMIN tries to promote STAFF to ADMIN', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(staffTarget);

      await expect(service.updateUser(1, 2, { rol: 'ADMIN' }, 'ADMIN')).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when ADMIN resets an OWNER password', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(ownerTarget);

      await expect(service.updateUser(1, 2, { password: 'newpass123' }, 'ADMIN')).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when ADMIN changes an OWNER email', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(ownerTarget);
      mockRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.updateUser(1, 2, { email: 'hijacked@test.com' }, 'ADMIN'),
      ).rejects.toThrow(ForbiddenError);
      expect(mockRepo.findByEmail).not.toHaveBeenCalled();
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when ADMIN updates another ADMIN password', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);

      await expect(service.updateUser(1, 2, { password: 'newpass123' }, 'ADMIN')).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when ADMIN renames an OWNER', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(ownerTarget);

      await expect(service.updateUser(1, 2, { nombre: 'New Name' }, 'ADMIN')).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should allow OWNER to update an ADMIN password', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);
      const updated = {
        id: 2,
        nombre: 'Admin',
        email: 'admin@test.com',
        rol: 'ADMIN',
        creadoEn: new Date(),
      };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateUser(1, 2, { password: 'newpass123' }, 'OWNER');

      expect(result).toEqual(updated);
      expect(mockRepo.update).toHaveBeenCalledWith(2, { password: 'hashed_password' });
    });

    it('should throw ForbiddenError when modifying an OWNER', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(ownerTarget);

      await expect(service.updateUser(1, 2, { rol: 'STAFF' }, 'OWNER')).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when demoting the last admin', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);
      mockRepo.countAdminsByNegocio.mockResolvedValue(1);

      await expect(service.updateUser(1, 2, { rol: 'STAFF' }, 'OWNER')).rejects.toThrow(
        ForbiddenError,
      );
      expect(mockRepo.countAdminsByNegocio).toHaveBeenCalledWith(1);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should allow OWNER to demote an ADMIN when there are more admins', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);
      mockRepo.countAdminsByNegocio.mockResolvedValue(2);
      const updated = {
        id: 2,
        nombre: 'Admin',
        email: 'admin@test.com',
        rol: 'STAFF',
        creadoEn: new Date(),
      };
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateUser(1, 2, { rol: 'STAFF' }, 'OWNER');

      expect(result).toEqual(updated);
      expect(mockRepo.update).toHaveBeenCalledWith(2, { rol: 'STAFF' });
    });
  });

  describe('deleteUser', () => {
    it('should throw ValidationError when deleting self', async () => {
      await expect(service.deleteUser(1, 1, 1, 'OWNER')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(null);

      await expect(service.deleteUser(1, 2, 1, 'OWNER')).rejects.toThrow(NotFoundError);
    });

    it('should delete user', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(staffTarget);

      await service.deleteUser(1, 2, 1, 'OWNER');

      expect(mockRepo.delete).toHaveBeenCalledWith(2);
    });

    it('should throw ForbiddenError when trying to delete an OWNER', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(ownerTarget);

      await expect(service.deleteUser(1, 2, 1, 'OWNER')).rejects.toThrow(ForbiddenError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when ADMIN tries to delete an ADMIN', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);

      await expect(service.deleteUser(1, 2, 1, 'ADMIN')).rejects.toThrow(ForbiddenError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when deleting the last admin', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);
      mockRepo.countAdminsByNegocio.mockResolvedValue(1);

      await expect(service.deleteUser(1, 2, 1, 'OWNER')).rejects.toThrow(ForbiddenError);
      expect(mockRepo.countAdminsByNegocio).toHaveBeenCalledWith(1);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('should allow OWNER to delete an ADMIN when there are more admins', async () => {
      mockRepo.findByIdAndNegocioId.mockResolvedValue(adminTarget);
      mockRepo.countAdminsByNegocio.mockResolvedValue(2);

      await service.deleteUser(1, 2, 1, 'OWNER');

      expect(mockRepo.delete).toHaveBeenCalledWith(2);
    });
  });
});
