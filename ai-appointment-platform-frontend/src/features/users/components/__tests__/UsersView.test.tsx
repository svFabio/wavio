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

const renderView = (viewerRole: 'OWNER' | 'ADMIN' | 'STAFF' = 'OWNER') =>
  render(
    <UsersView
      users={users}
      viewerRole={viewerRole}
      onOpenModal={vi.fn()}
      onInvite={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />,
  );

describe('UsersView', () => {
  it('renders user list', () => {
    renderView();
    expect(screen.getAllByText('User Management')[0]).toBeInTheDocument();
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
        onInvite={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await userEvt.click(screen.getAllByText('New User')[0]);
    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });

  it('renders the Invite button for ADMIN and OWNER viewers', () => {
    renderView('ADMIN');
    expect(screen.getAllByText('Invite').length).toBeGreaterThanOrEqual(1);
  });

  it('hides the Invite button for STAFF viewers', () => {
    renderView('STAFF');
    expect(screen.queryByText('Invite')).not.toBeInTheDocument();
  });

  it('calls onInvite when the Invite button is clicked', async () => {
    const onInvite = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UsersView
        users={users}
        viewerRole="OWNER"
        onOpenModal={vi.fn()}
        onInvite={onInvite}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await userEvt.click(screen.getAllByText('Invite')[0]);
    expect(onInvite).toHaveBeenCalledTimes(1);
  });
});
