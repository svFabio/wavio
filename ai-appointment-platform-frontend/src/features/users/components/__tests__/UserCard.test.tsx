import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UserCard } from '../UserCard';
import type { User } from '../../types';

const user: User = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.com',
  rol: 'ADMIN',
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('UserCard', () => {
  it('renders user data', () => {
    render(
      <table>
        <tbody>
          <UserCard user={user} onEdit={vi.fn()} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    expect(screen.getByText('Admin Test')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <table>
        <tbody>
          <UserCard user={user} onEdit={onEdit} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    await userEvt.click(screen.getByLabelText('Editar Admin Test'));
    expect(onEdit).toHaveBeenCalledWith(user);
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <table>
        <tbody>
          <UserCard user={user} onEdit={vi.fn()} onDelete={onDelete} />
        </tbody>
      </table>,
    );
    await userEvt.click(screen.getByLabelText('Eliminar Admin Test'));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
