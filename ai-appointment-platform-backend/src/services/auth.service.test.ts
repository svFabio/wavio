import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { UnauthorizedError, ConflictError, NotFoundError } from '../domain/errors';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../repositories/auth.repository', () => ({
  authRepository: {
    findNegocioByGoogleId: vi.fn(),
    createNegocioWithAdmin: vi.fn(),
    findUsuarioByNegocioAndGoogleId: vi.fn(),
    findUsuarioById: vi.fn(),
    findNegociosByUsuarioId: vi.fn(),
    findUsuarioByEmail: vi.fn(),
    findUsuarioByNegocioId: vi.fn(),
  },
}));

vi.mock('../repositories/usuarios.repository', () => ({
  usuariosRepository: {
    findFirstByGoogleId: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../repositories/usuarioNegocio.repository', () => ({
  usuarioNegocioRepository: {
    upsertMembership: vi.fn(),
    findByUsuarioIdAndNegocioId: vi.fn(),
  },
}));

vi.mock('../lib/cloudinary', () => ({ uploadBase64Image: vi.fn() }));

// Mock google-auth-library BEFORE importing the service
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = vi.fn();
  },
}));

// Mock config/env so JWT_SECRET is always present
vi.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-32-chars-minimum-ok',
    GOOGLE_CLIENT_ID: 'test-client-id',
    NODE_ENV: 'test',
  },
}));

import { authRepository } from '../repositories/auth.repository';
import bcrypt from 'bcryptjs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUsuario(overrides = {}) {
  return {
    id: 1,
    nombre: 'Test User',
    email: 'test@example.com',
    password: '',
    googleId: 'google-123',
    fotoPerfil: null,
    rol: 'ADMIN',
    creadoEn: new Date(),
    ...overrides,
  };
}

function makeNegocio(overrides = {}) {
  return {
    id: 10,
    googleId: 'google-123',
    email: 'test@example.com',
    nombre: 'Test Negocio',
    plan: 'FREE',
    waAccessToken: null,
    waPhoneNumberId: null,
    waWabaId: null,
    waAppId: null,
    isWaConnected: false,
    creadoEn: new Date(),
    ...overrides,
  };
}

// ─── loginConEmail ─────────────────────────────────────────────────────────────

describe('authService.loginConEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws UnauthorizedError when user not found', async () => {
    vi.mocked(authRepository.findUsuarioByEmail).mockResolvedValueOnce(null);
    await expect(authService.loginConEmail('x@x.com', 'pass')).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when password is wrong', async () => {
    const usuario = makeUsuario({ password: await bcrypt.hash('correct', 10) });
    vi.mocked(authRepository.findUsuarioByEmail).mockResolvedValueOnce(usuario as any);
    await expect(authService.loginConEmail('x@x.com', 'wrong')).rejects.toThrow(UnauthorizedError);
  });

  it('throws NotFoundError when user has no negocios', async () => {
    const hashed = await bcrypt.hash('pass', 10);
    const usuario = makeUsuario({ password: hashed });
    vi.mocked(authRepository.findUsuarioByEmail).mockResolvedValueOnce(usuario as any);
    vi.mocked(authRepository.findNegociosByUsuarioId).mockResolvedValueOnce([]);
    await expect(authService.loginConEmail('x@x.com', 'pass')).rejects.toThrow(NotFoundError);
  });

  it('returns token and usuario on valid credentials', async () => {
    const hashed = await bcrypt.hash('pass', 10);
    const usuario = makeUsuario({ password: hashed });
    const negocio = makeNegocio();
    vi.mocked(authRepository.findUsuarioByEmail).mockResolvedValueOnce(usuario as any);
    vi.mocked(authRepository.findNegociosByUsuarioId).mockResolvedValueOnce([negocio as any]);

    const result = await authService.loginConEmail('test@example.com', 'pass');

    expect(result.token).toBeDefined();
    expect(result.esNuevo).toBe(false);
    expect(result.negocios).toHaveLength(1);
    expect(result.usuario.email).toBe('test@example.com');
    // password must not be in the response
    expect((result.usuario as any).password).toBeUndefined();
  });
});

// ─── registrarConEmail ─────────────────────────────────────────────────────────

describe('authService.registrarConEmail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws ConflictError when email already exists', async () => {
    vi.mocked(authRepository.findUsuarioByEmail).mockResolvedValueOnce(makeUsuario() as any);
    await expect(authService.registrarConEmail('x@x.com', 'pass')).rejects.toThrow(ConflictError);
  });

  it('creates negocio and returns token on success', async () => {
    vi.mocked(authRepository.findUsuarioByEmail).mockResolvedValueOnce(null);
    vi.mocked(authRepository.createNegocioWithAdmin).mockResolvedValueOnce(makeNegocio() as any);
    const usuario = makeUsuario();
    vi.mocked(authRepository.findUsuarioByNegocioId).mockResolvedValueOnce(usuario as any);
    vi.mocked(authRepository.findNegociosByUsuarioId).mockResolvedValueOnce([makeNegocio() as any]);

    const result = await authService.registrarConEmail('new@example.com', 'pass');

    expect(result.token).toBeDefined();
    expect(result.esNuevo).toBe(true);
  });
});

// ─── obtenerUsuarioActual ──────────────────────────────────────────────────────

describe('authService.obtenerUsuarioActual', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws NotFoundError when userId does not exist', async () => {
    vi.mocked(authRepository.findUsuarioById).mockResolvedValueOnce(null);
    await expect(authService.obtenerUsuarioActual(999)).rejects.toThrow(NotFoundError);
  });

  it('returns usuario and negocios on valid userId', async () => {
    vi.mocked(authRepository.findUsuarioById).mockResolvedValueOnce(makeUsuario() as any);
    vi.mocked(authRepository.findNegociosByUsuarioId).mockResolvedValueOnce([makeNegocio() as any]);

    const result = await authService.obtenerUsuarioActual(1);

    expect(result.usuario.id).toBe(1);
    expect(result.negocios).toHaveLength(1);
  });
});
