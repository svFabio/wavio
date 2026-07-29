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
    render(<UsersView users={users} onOpenModal={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Gestion de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('calls onOpenModal when new user button clicked', async () => {
    const onOpenModal = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UsersView users={users} onOpenModal={onOpenModal} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    await userEvt.click(screen.getByText('Nuevo Usuario'));
    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });
});
