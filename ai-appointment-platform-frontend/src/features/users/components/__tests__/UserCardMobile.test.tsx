import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UserCardMobile } from '../UserCardMobile';
import type { User } from '../../types';

const staffUser: User = {
  id: 1,
  nombre: 'Staff User',
  email: 'staff@test.com',
  rol: 'STAFF',
  creadoEn: '2026-01-01T00:00:00Z',
};

const ownerUser: User = {
  id: 2,
  nombre: 'Owner User',
  email: 'owner@test.com',
  rol: 'OWNER',
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('UserCardMobile', () => {
  it('renders user data', () => {
    render(
      <UserCardMobile user={staffUser} viewerRole="OWNER" onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('Staff User')).toBeInTheDocument();
    expect(screen.getByText('staff@test.com')).toBeInTheDocument();
    expect(screen.getByText('STAFF')).toBeInTheDocument();
  });

  it('renders OWNER badge for owner user', () => {
    render(
      <UserCardMobile user={ownerUser} viewerRole="OWNER" onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText('Protegido')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UserCardMobile user={staffUser} viewerRole="OWNER" onEdit={onEdit} onDelete={vi.fn()} />,
    );
    await userEvt.click(screen.getByLabelText('Editar Staff User'));
    expect(onEdit).toHaveBeenCalledWith(staffUser);
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UserCardMobile user={staffUser} viewerRole="OWNER" onEdit={vi.fn()} onDelete={onDelete} />,
    );
    await userEvt.click(screen.getByLabelText('Eliminar Staff User'));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
