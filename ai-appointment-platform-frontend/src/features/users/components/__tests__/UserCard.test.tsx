import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UserCard } from '../UserCard';
import type { User } from '../../types';

const adminUser: User = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.com',
  rol: 'ADMIN',
  creadoEn: '2026-01-01T00:00:00Z',
};

const staffUser: User = {
  id: 2,
  nombre: 'Staff Test',
  email: 'staff@test.com',
  rol: 'STAFF',
  creadoEn: '2026-01-01T00:00:00Z',
};

const ownerUser: User = {
  id: 3,
  nombre: 'Owner Test',
  email: 'owner@test.com',
  rol: 'OWNER',
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('UserCard', () => {
  it('renders user data', () => {
    render(
      <table>
        <tbody>
          <UserCard user={adminUser} viewerRole="OWNER" onEdit={vi.fn()} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    expect(screen.getByText('Admin Test')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('renders OWNER badge for owner user', () => {
    render(
      <table>
        <tbody>
          <UserCard user={ownerUser} viewerRole="OWNER" onEdit={vi.fn()} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    expect(screen.getByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText('Protegido')).toBeInTheDocument();
  });

  it('hides edit/delete for OWNER row', () => {
    render(
      <table>
        <tbody>
          <UserCard user={ownerUser} viewerRole="OWNER" onEdit={vi.fn()} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    expect(screen.queryByLabelText(/Editar/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Eliminar/)).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked (OWNER viewer, STAFF row)', async () => {
    const onEdit = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <table>
        <tbody>
          <UserCard user={staffUser} viewerRole="OWNER" onEdit={onEdit} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    await userEvt.click(screen.getByLabelText('Editar Staff Test'));
    expect(onEdit).toHaveBeenCalledWith(staffUser);
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <table>
        <tbody>
          <UserCard user={staffUser} viewerRole="OWNER" onEdit={vi.fn()} onDelete={onDelete} />
        </tbody>
      </table>,
    );
    await userEvt.click(screen.getByLabelText('Eliminar Staff Test'));
    expect(onDelete).toHaveBeenCalledWith(2);
  });

  it('ADMIN viewer cannot modify ADMIN row', () => {
    render(
      <table>
        <tbody>
          <UserCard user={adminUser} viewerRole="ADMIN" onEdit={vi.fn()} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    // ADMIN cannot touch another ADMIN - Protected is shown
    expect(screen.getByText('Protegido')).toBeInTheDocument();
  });
});
