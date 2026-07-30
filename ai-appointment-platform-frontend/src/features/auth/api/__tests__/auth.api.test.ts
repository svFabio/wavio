import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../auth.api';

vi.mock('../../../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { apiClient } from '../../../../lib/apiClient';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockPatch = vi.mocked(apiClient.patch);
const mockDelete = vi.mocked(apiClient.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authApi.loginConGoogle', () => {
  it('calls POST /auth/google with token', async () => {
    const response = {
      token: 'jwt-token',
      usuario: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'ADMIN' as const },
      negocios: [],
    };
    mockPost.mockResolvedValue(response);
    const result = await authApi.loginConGoogle('google-token');
    expect(mockPost).toHaveBeenCalledWith('/auth/google', { googleToken: 'google-token' });
    expect(result).toEqual(response);
  });
});

describe('authApi.register', () => {
  it('calls POST /auth/register', async () => {
    const response = {
      token: 'jwt-token',
      usuario: { id: 1, nombre: '', email: 'new@test.com', rol: 'ADMIN' as const },
      negocios: [],
    };
    mockPost.mockResolvedValue(response);
    const result = await authApi.register('new@test.com', 'password');
    expect(mockPost).toHaveBeenCalledWith('/auth/register', {
      email: 'new@test.com',
      password: 'password',
    });
    expect(result).toEqual(response);
  });

  it('throws on ApiError', async () => {
    const { ApiError } = await import('../../../../lib/apiClient');
    mockPost.mockRejectedValue(new ApiError('Email exists', 409, null));
    await expect(authApi.register('exists@test.com', 'pass')).rejects.toThrow('Email exists');
  });
});

describe('authApi.login', () => {
  it('calls POST /auth/login', async () => {
    const response = {
      token: 'jwt-token',
      usuario: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'ADMIN' as const },
      negocios: [{ id: 1, nombre: 'Negocio', plan: 'PRO' as const }],
    };
    mockPost.mockResolvedValue(response);
    const result = await authApi.login('test@test.com', 'pass');
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'pass',
    });
    expect(result).toEqual(response);
  });
});

describe('authApi.me', () => {
  it('calls GET /auth/me', async () => {
    const response = {
      usuario: { id: 1, nombre: 'Test', email: 'test@test.com', rol: 'ADMIN' as const },
      negocios: [],
    };
    mockGet.mockResolvedValue(response);
    const result = await authApi.me();
    expect(mockGet).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(response);
  });

  it('returns null on 401', async () => {
    const { ApiError } = await import('../../../../lib/apiClient');
    mockGet.mockRejectedValue(new ApiError('Unauthorized', 401, null));
    const result = await authApi.me();
    expect(result).toBeNull();
  });
});

describe('authApi.updateAvatar', () => {
  it('calls PUT /auth/me/avatar', async () => {
    mockPut.mockResolvedValue({ url: 'https://example.com/avatar.png' });
    const result = await authApi.updateAvatar('base64data');
    expect(mockPut).toHaveBeenCalledWith('/auth/me/avatar', { image: 'base64data' });
    expect(result).toEqual({ url: 'https://example.com/avatar.png' });
  });
});

describe('authApi.deleteAvatar', () => {
  it('calls DELETE /auth/me/avatar', async () => {
    mockDelete.mockResolvedValue({ success: true });
    const result = await authApi.deleteAvatar();
    expect(mockDelete).toHaveBeenCalledWith('/auth/me/avatar');
    expect(result).toEqual({ success: true });
  });
});

describe('authApi.updateNombre', () => {
  it('calls PATCH /auth/me/nombre', async () => {
    mockPatch.mockResolvedValue({ nombre: 'New Name' });
    const result = await authApi.updateNombre('New Name');
    expect(mockPatch).toHaveBeenCalledWith('/auth/me/nombre', { nombre: 'New Name' });
    expect(result).toEqual({ nombre: 'New Name' });
  });
});
