import { screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { UsersContainer } from '../UsersContainer.container';
import type { User } from '../../types';
import { usersApi } from '../../api/users.api';

vi.mock('../../api/users.api', () => ({
  usersApi: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('UsersContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(usersApi.getUsers).mockReturnValue(new Promise(() => {}) as never);
    renderWithProviders(<UsersContainer />);
  });

  it('renders empty state when no users', async () => {
    vi.mocked(usersApi.getUsers).mockResolvedValue([] as never);
    renderWithProviders(<UsersContainer />);
    expect(await screen.findByText('No users registered')).toBeInTheDocument();
  });

  it('renders user list', async () => {
    const users: User[] = [
      {
        id: 1,
        nombre: 'Admin',
        email: 'admin@test.com',
        rol: 'ADMIN',
        creadoEn: '2026-01-01T00:00:00Z',
      },
    ];
    vi.mocked(usersApi.getUsers).mockResolvedValue(users as never);
    renderWithProviders(<UsersContainer />);
    const adminElements = await screen.findAllByText('Admin');
    expect(adminElements.length).toBeGreaterThanOrEqual(1);
  });
});
