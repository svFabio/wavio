import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UserCardMobile } from '../UserCardMobile';
import type { User } from '../../types';

const user: User = {
  id: 1,
  nombre: 'Staff User',
  email: 'staff@test.com',
  rol: 'STAFF',
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('UserCardMobile', () => {
  it('renders user data', () => {
    render(<UserCardMobile user={user} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Staff User')).toBeInTheDocument();
    expect(screen.getByText('staff@test.com')).toBeInTheDocument();
    expect(screen.getByText('STAFF')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn();
    const userEvt = userEvent.setup();
    render(<UserCardMobile user={user} onEdit={onEdit} onDelete={vi.fn()} />);
    await userEvt.click(screen.getByLabelText('Editar Staff User'));
    expect(onEdit).toHaveBeenCalledWith(user);
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    const userEvt = userEvent.setup();
    render(<UserCardMobile user={user} onEdit={vi.fn()} onDelete={onDelete} />);
    await userEvt.click(screen.getByLabelText('Eliminar Staff User'));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
