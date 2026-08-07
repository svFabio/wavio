import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UsersView } from '../UsersView';
import type { User } from '../../types';

const users: User[] = [
  {
    id: 1,
    nombre: 'Admin',
    email: 'admin@test.com',
    rol: 'ADMIN',
    creadoEn: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    nombre: 'Staff',
    email: 'staff@test.com',
    rol: 'STAFF',
    creadoEn: '2026-01-02T00:00:00Z',
  },
];

describe('UsersView', () => {
  it('renders user list', () => {
    render(
      <UsersView
        users={users}
        viewerRole="OWNER"
        onOpenModal={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getAllByText('Admin')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Staff')[0]).toBeInTheDocument();
  });

  it('calls onOpenModal when new user button clicked', async () => {
    const onOpenModal = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UsersView
        users={users}
        viewerRole="OWNER"
        onOpenModal={onOpenModal}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await userEvt.click(screen.getByText('New User'));
    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });
});
