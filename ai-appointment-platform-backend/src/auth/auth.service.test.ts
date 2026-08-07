import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import type { AuthRepository } from './auth.repository';
import { UnauthorizedError, ConflictError, NotFoundError } from '../domain/errors';

vi.hoisted(() => {
  process.env.LOG_LEVEL = 'fatal';
});

const mockVerifyIdToken = vi.hoisted(() => vi.fn());
const mockBcryptHash = vi.hoisted(() => vi.fn());
const mockBcryptCompare = vi.hoisted(() => vi.fn());
const mockJwtSign = vi.hoisted(() => vi.fn().mockReturnValue('mock-jwt-token'));
const mockUploadBase64Image = vi.hoisted(() =>
  vi.fn().mockResolvedValue('https://cloudinary.com/avatar.jpg'),
);

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(function () {
    return { verifyIdToken: mockVerifyIdToken };
  }),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: mockBcryptHash, compare: mockBcryptCompare },
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: mockJwtSign },
  sign: mockJwtSign,
}));

vi.mock('../lib/cloudinary', () => ({
  uploadBase64Image: mockUploadBase64Image,
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthRepository: Record<string, ReturnType<typeof vi.fn>>;

  const makePayload = (overrides = {}) => ({
    sub: 'google_123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  });

  beforeEach(() => {
    mockAuthRepository = {
      findNegocioByGoogleId: vi.fn(),
      createNegocioWithAdmin: vi.fn(),
      findUsuarioByNegocioAndGoogleId: vi.fn(),
      findFirstByGoogleId: vi.fn(),
      upsertMembership: vi.fn(),
      findUsuarioById: vi.fn(),
      findNegociosByUsuarioId: vi.fn(),
      findUsuarioByEmail: vi.fn(),
      findUsuarioByNegocioId: vi.fn(),
      updateUsuario: vi.fn(),
      findUsuarioNegocioMembership: vi.fn(),
    };

    service = new AuthService(mockAuthRepository as unknown as AuthRepository);

    mockVerifyIdToken.mockReset();
    mockBcryptHash.mockReset();
    mockBcryptCompare.mockReset();
    mockJwtSign.mockReset().mockReturnValue('mock-jwt-token');
    mockUploadBase64Image.mockReset().mockResolvedValue('https://cloudinary.com/avatar.jpg');
  });

  /* ─── loginConGoogle ─────────────────────────────────────────────── */

  describe('loginConGoogle', () => {
    const validGoogleToken = 'header.payload.signature';

    it('should register a new negocio and return token for first-time user', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => makePayload(),
      });
      mockAuthRepository.findNegocioByGoogleId.mockResolvedValue(null);
      mockAuthRepository.createNegocioWithAdmin.mockResolvedValue({
        id: 10,
        googleId: 'google_123',
        email: 'test@example.com',
        nombre: 'Mi Negocio',
        plan: 'FREE',
        waPhoneNumberId: null,
        waWabaId: null,
        waAppId: null,
        isWaConnected: false,
        creadoEn: new Date(),
      });
      mockAuthRepository.findUsuarioByNegocioAndGoogleId.mockResolvedValue({
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        googleId: 'google_123',
        rol: 'OWNER',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockAuthRepository.findNegociosByUsuarioId.mockResolvedValue([
        {
          id: 10,
          googleId: 'google_123',
          email: 'test@example.com',
          nombre: 'Test Negocio',
          plan: 'FREE',
          waPhoneNumberId: null,
          waWabaId: null,
          waAppId: null,
          isWaConnected: false,
          creadoEn: new Date(),
        },
      ]);

      const result = await service.loginConGoogle(validGoogleToken);

      expect(result.token).toBe('mock-jwt-token');
      expect(result.esNuevo).toBe(true);
      expect(result.usuario.rol).toBe('OWNER');
      expect(mockAuthRepository.createNegocioWithAdmin).toHaveBeenCalledWith(
        'google_123',
        'test@example.com',
        'Test User',
      );
    });

    it('should upsert OWNER membership when existing user joins an existing negocio', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => makePayload(),
      });
      mockAuthRepository.findNegocioByGoogleId.mockResolvedValue({
        id: 5,
        googleId: 'google_123',
        email: 'test@example.com',
        nombre: 'Existing',
        plan: 'FREE',
        waPhoneNumberId: null,
        waWabaId: null,
        waAppId: null,
        isWaConnected: false,
        creadoEn: new Date(),
      });
      mockAuthRepository.findUsuarioByNegocioAndGoogleId.mockResolvedValue(null);
      mockAuthRepository.findFirstByGoogleId.mockResolvedValue({ id: 2 });
      mockAuthRepository.upsertMembership.mockResolvedValue({
        usuarioId: 2,
        negocioId: 5,
        rol: 'OWNER',
      });
      mockAuthRepository.findUsuarioById.mockResolvedValue({
        id: 2,
        nombre: 'Test User',
        email: 'test@example.com',
        googleId: 'google_123',
        rol: 'OWNER',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockAuthRepository.findNegociosByUsuarioId.mockResolvedValue([
        {
          id: 5,
          googleId: 'google_123',
          email: 'test@example.com',
          nombre: 'Existing',
          plan: 'FREE',
          waPhoneNumberId: null,
          waWabaId: null,
          waAppId: null,
          isWaConnected: false,
          creadoEn: new Date(),
        },
      ]);

      const result = await service.loginConGoogle(validGoogleToken);

      expect(result.esNuevo).toBe(false);
      expect(mockAuthRepository.upsertMembership).toHaveBeenCalledWith(2, 5, 'OWNER');
      expect(result.usuario.rol).toBe('OWNER');
    });

    it('should return existing negocio for returning user', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => makePayload(),
      });
      mockAuthRepository.findNegocioByGoogleId.mockResolvedValue({
        id: 5,
        googleId: 'google_123',
        email: 'test@example.com',
        nombre: 'Existing',
        plan: 'FREE',
        waPhoneNumberId: null,
        waWabaId: null,
        waAppId: null,
        isWaConnected: false,
        creadoEn: new Date(),
      });
      mockAuthRepository.findUsuarioByNegocioAndGoogleId.mockResolvedValue({
        id: 2,
        nombre: 'Test User',
        email: 'test@example.com',
        googleId: 'google_123',
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockAuthRepository.findNegociosByUsuarioId.mockResolvedValue([
        {
          id: 5,
          googleId: 'google_123',
          email: 'test@example.com',
          nombre: 'Existing',
          plan: 'FREE',
          waPhoneNumberId: null,
          waWabaId: null,
          waAppId: null,
          isWaConnected: false,
          creadoEn: new Date(),
        },
      ]);

      const result = await service.loginConGoogle(validGoogleToken);

      expect(result.token).toBe('mock-jwt-token');
      expect(result.esNuevo).toBe(false);
      expect(mockAuthRepository.createNegocioWithAdmin).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when Google token has invalid format', async () => {
      await expect(service.loginConGoogle('invalid-token')).rejects.toThrow(UnauthorizedError);
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when verifyIdToken returns null payload', async () => {
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => null });

      await expect(service.loginConGoogle(validGoogleToken)).rejects.toThrow(UnauthorizedError);
    });
  });

  /* ─── registrarConEmail ──────────────────────────────────────────── */

  describe('registrarConEmail', () => {
    it('should create account and return token', async () => {
      mockAuthRepository.findUsuarioByEmail.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed_password');
      mockAuthRepository.createNegocioWithAdmin.mockResolvedValue({
        id: 1,
        googleId: 'email-test@example.com',
        email: 'test@example.com',
        nombre: 'Mi Negocio',
        plan: 'FREE',
        waPhoneNumberId: null,
        waWabaId: null,
        waAppId: null,
        isWaConnected: false,
        creadoEn: new Date(),
      });
      mockAuthRepository.findUsuarioByNegocioId.mockResolvedValue({
        id: 1,
        nombre: 'test',
        email: 'test@example.com',
        googleId: null,
        rol: 'OWNER',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockAuthRepository.findNegociosByUsuarioId.mockResolvedValue([
        {
          id: 1,
          googleId: 'email-test@example.com',
          email: 'test@example.com',
          nombre: 'Mi Negocio',
          plan: 'FREE',
          waPhoneNumberId: null,
          waWabaId: null,
          waAppId: null,
          isWaConnected: false,
          creadoEn: new Date(),
        },
      ]);

      const result = await service.registrarConEmail('test@example.com', 'securepass');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.esNuevo).toBe(true);
      expect(result.usuario.rol).toBe('OWNER');
      expect(mockBcryptHash).toHaveBeenCalledWith('securepass', 10);
    });

    it('should throw ConflictError when email already exists', async () => {
      mockAuthRepository.findUsuarioByEmail.mockResolvedValue({
        id: 1,
        nombre: 'Existing',
        email: 'test@example.com',
        password: 'hash',
        googleId: null,
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      } as never);

      await expect(service.registrarConEmail('test@example.com', 'pass')).rejects.toThrow(
        ConflictError,
      );
    });
  });

  /* ─── loginConEmail ──────────────────────────────────────────────── */

  describe('loginConEmail', () => {
    it('should return token on valid credentials', async () => {
      mockAuthRepository.findUsuarioByEmail.mockResolvedValue({
        id: 1,
        nombre: 'User',
        email: 'user@test.com',
        password: 'hashed',
        googleId: null,
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      } as never);
      mockBcryptCompare.mockResolvedValue(true);
      mockAuthRepository.findNegociosByUsuarioId.mockResolvedValue([
        {
          id: 1,
          googleId: 'g1',
          email: 'n@n.com',
          nombre: 'N',
          plan: 'FREE',
          waPhoneNumberId: null,
          waWabaId: null,
          waAppId: null,
          isWaConnected: false,
          creadoEn: new Date(),
        },
      ]);

      const result = await service.loginConEmail('user@test.com', 'pass');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.usuario.email).toBe('user@test.com');
    });

    it('should throw UnauthorizedError when user not found', async () => {
      mockAuthRepository.findUsuarioByEmail.mockResolvedValue(null);

      await expect(service.loginConEmail('unknown@test.com', 'pass')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should throw UnauthorizedError when password is wrong', async () => {
      mockAuthRepository.findUsuarioByEmail.mockResolvedValue({
        id: 1,
        nombre: 'User',
        email: 'user@test.com',
        password: 'hashed',
        googleId: null,
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      } as never);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(service.loginConEmail('user@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should throw NotFoundError when usuario has no negocios', async () => {
      mockAuthRepository.findUsuarioByEmail.mockResolvedValue({
        id: 1,
        nombre: 'User',
        email: 'user@test.com',
        password: 'hashed',
        googleId: null,
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      } as never);
      mockBcryptCompare.mockResolvedValue(true);
      mockAuthRepository.findNegociosByUsuarioId.mockResolvedValue([]);

      await expect(service.loginConEmail('user@test.com', 'pass')).rejects.toThrow(NotFoundError);
    });
  });

  /* ─── obtenerUsuarioActual ───────────────────────────────────────── */

  describe('obtenerUsuarioActual', () => {
    it('should return usuario and negocios', async () => {
      mockAuthRepository.findUsuarioById.mockResolvedValue({
        id: 1,
        nombre: 'User',
        email: 'u@t.com',
        googleId: null,
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockAuthRepository.findNegociosByUsuarioId.mockResolvedValue([
        {
          id: 1,
          googleId: 'g1',
          email: 'n@n.com',
          nombre: 'N',
          plan: 'FREE',
          waPhoneNumberId: null,
          waWabaId: null,
          waAppId: null,
          isWaConnected: false,
          creadoEn: new Date(),
        },
      ]);

      const result = await service.obtenerUsuarioActual(1);

      expect(result.usuario.email).toBe('u@t.com');
      expect(result.negocios).toHaveLength(1);
    });

    it('should throw NotFoundError when usuario not found', async () => {
      mockAuthRepository.findUsuarioById.mockResolvedValue(null);

      await expect(service.obtenerUsuarioActual(999)).rejects.toThrow(NotFoundError);
    });
  });

  /* ─── updateAvatar ───────────────────────────────────────────────── */

  describe('updateAvatar', () => {
    it('should upload image and update usuario', async () => {
      mockAuthRepository.findUsuarioById.mockResolvedValue({
        id: 1,
        nombre: 'U',
        email: 'u@t.com',
        googleId: null,
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockAuthRepository.findUsuarioNegocioMembership.mockResolvedValue({
        usuarioId: 1,
        negocioId: 5,
        rol: 'ADMIN',
      });
      mockAuthRepository.updateUsuario.mockResolvedValue({
        id: 1,
        nombre: 'U',
        email: 'u@t.com',
        rol: 'ADMIN',
        creadoEn: new Date(),
      });

      const result = await service.updateAvatar(1, 5, 'base64data');

      expect(result.fotoPerfil).toBe('https://cloudinary.com/avatar.jpg');
      expect(mockUploadBase64Image).toHaveBeenCalledWith('base64data', 'wavio/users/1');
    });

    it('should throw NotFoundError when usuario not found', async () => {
      mockAuthRepository.findUsuarioById.mockResolvedValue(null);

      await expect(service.updateAvatar(999, 1, 'data')).rejects.toThrow(NotFoundError);
    });
  });

  /* ─── updateNombre ───────────────────────────────────────────────── */

  describe('updateNombre', () => {
    it('should update and return the new name', async () => {
      mockAuthRepository.findUsuarioById.mockResolvedValue({
        id: 1,
        nombre: 'Old',
        email: 'u@t.com',
        googleId: null,
        rol: 'ADMIN',
        creadoEn: new Date(),
        fotoPerfil: null,
      });
      mockAuthRepository.findUsuarioNegocioMembership.mockResolvedValue({
        usuarioId: 1,
        negocioId: 5,
        rol: 'ADMIN',
      });
      mockAuthRepository.updateUsuario.mockResolvedValue({
        id: 1,
        nombre: 'New Name',
        email: 'u@t.com',
        rol: 'ADMIN',
        creadoEn: new Date(),
      });

      const result = await service.updateNombre(1, 5, '  New Name  ');

      expect(result.nombre).toBe('New Name');
      expect(mockAuthRepository.updateUsuario).toHaveBeenCalledWith(1, { nombre: 'New Name' });
    });
  });
});
