import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersApi } from '../users.api';

vi.mock('../../../../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../../../../lib/apiClient';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usersApi.getUsers', () => {
  it('calls GET /users', async () => {
    const users = [
      {
        id: 1,
        nombre: 'Admin',
        email: 'admin@test.com',
        rol: 'ADMIN',
        creadoEn: '2026-01-01T00:00:00Z',
      },
    ];
    mockGet.mockResolvedValue({ data: users, pagination: {} });
    const result = await usersApi.getUsers();
    expect(mockGet).toHaveBeenCalledWith('/users');
    expect(result).toEqual(users);
  });
});

describe('usersApi.createUser', () => {
  it('calls POST /users with data', async () => {
    mockPost.mockResolvedValue({});
    const data = {
      nombre: 'Staff',
      email: 'staff@test.com',
      password: '123456',
      rol: 'STAFF' as const,
    };
    await usersApi.createUser(data);
    expect(mockPost).toHaveBeenCalledWith('/users', data);
  });
});

describe('usersApi.updateUser', () => {
  it('calls PUT /users/:id with data', async () => {
    mockPut.mockResolvedValue({});
    const data = {
      nombre: 'Updated',
      email: 'updated@test.com',
      password: '',
      rol: 'ADMIN' as const,
    };
    await usersApi.updateUser(1, data);
    expect(mockPut).toHaveBeenCalledWith('/users/1', data);
  });
});

describe('usersApi.deleteUser', () => {
  it('calls DELETE /users/:id', async () => {
    mockDelete.mockResolvedValue({});
    await usersApi.deleteUser(5);
    expect(mockDelete).toHaveBeenCalledWith('/users/5');
  });
});
