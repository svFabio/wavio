import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { UsersContainer } from '../UsersContainer.container';
import type { User } from '../../types';
import { usersApi } from '../../api/users.api';
import { invitationsApi } from '../../api/invitations.api';

vi.mock('../../api/users.api', () => ({
  usersApi: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

vi.mock('../../api/invitations.api', () => ({
  invitationsApi: {
    getInvitations: vi.fn(),
    createInvitation: vi.fn(),
    resendInvitation: vi.fn(),
    cancelInvitation: vi.fn(),
  },
}));

const ownerAuth = {
  usuario: { id: 1, nombre: 'Owner', email: 'owner@test.com', rol: 'OWNER' as const },
  isAuthenticated: true,
  isAdmin: true,
  isOwner: true,
};

const staffAuth = {
  usuario: { id: 2, nombre: 'Staff', email: 'staff@test.com', rol: 'STAFF' as const },
  isAuthenticated: true,
  isAdmin: false,
  isOwner: false,
};

const user: User = {
  id: 1,
  nombre: 'Admin',
  email: 'admin@test.com',
  rol: 'ADMIN',
  creadoEn: '2026-01-01T00:00:00Z',
};

const pendingInvitation = {
  id: 1,
  email: 'pendiente@test.com',
  rol: 'STAFF' as const,
  estado: 'PENDIENTE' as const,
  expiraEn: '2026-01-10T00:00:00Z',
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('UsersContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usersApi.getUsers).mockResolvedValue([user]);
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue([]);
    vi.mocked(invitationsApi.createInvitation).mockResolvedValue({
      url: 'http://localhost:3000/api/v1/invitaciones/aceptar/tok123',
    });
    vi.mocked(invitationsApi.resendInvitation).mockResolvedValue({
      url: 'http://localhost:3000/api/v1/invitaciones/aceptar/tok456',
      expiraEn: '2026-01-11T00:00:00Z',
    });
    vi.mocked(invitationsApi.cancelInvitation).mockResolvedValue({ id: 1, estado: 'CANCELADA' });
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
    renderWithProviders(<UsersContainer />);
    const adminElements = await screen.findAllByText('Admin');
    expect(adminElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Invite button and invitations section for ADMIN/OWNER viewers', async () => {
    renderWithProviders(<UsersContainer />, { auth: ownerAuth });
    expect(await screen.findByText('No invitations yet')).toBeInTheDocument();
    expect(screen.getAllByText('Invite').length).toBeGreaterThanOrEqual(1);
  });

  it('hides the invite UI for STAFF viewers', async () => {
    renderWithProviders(<UsersContainer />, { auth: staffAuth });
    expect((await screen.findAllByText('Admin')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Invite')).not.toBeInTheDocument();
    expect(screen.queryByText('No invitations yet')).not.toBeInTheDocument();
  });

  it('opens the invite modal when Invite is clicked', async () => {
    const userEvt = userEvent.setup();
    renderWithProviders(<UsersContainer />, { auth: ownerAuth });
    expect((await screen.findAllByText('Admin')).length).toBeGreaterThanOrEqual(1);
    await userEvt.click(screen.getAllByText('Invite')[0]);
    expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
  });

  it('submits the invite form, calls createInvitation and shows the success link', async () => {
    const userEvt = userEvent.setup();
    renderWithProviders(<UsersContainer />, { auth: ownerAuth });
    expect((await screen.findAllByText('Admin')).length).toBeGreaterThanOrEqual(1);
    await userEvt.click(screen.getAllByText('Invite')[0]);
    await userEvt.type(screen.getByLabelText('Email address'), 'nuevo@test.com');
    await userEvt.click(screen.getByText('Send Invitation'));

    expect(invitationsApi.createInvitation).toHaveBeenCalledWith({
      email: 'nuevo@test.com',
      rol: 'STAFF',
    });
    expect(await screen.findByText('Invitation sent')).toBeInTheDocument();
    expect(screen.getByText(/tok123/)).toBeInTheDocument();
    expect(screen.queryByText('Invite Team Member')).not.toBeInTheDocument();
  });

  it('renders invitation rows', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue([pendingInvitation]);
    renderWithProviders(<UsersContainer />, { auth: ownerAuth });
    expect(await screen.findByText('pendiente@test.com')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('calls resendInvitation when Resend is clicked', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue([pendingInvitation]);
    const userEvt = userEvent.setup();
    renderWithProviders(<UsersContainer />, { auth: ownerAuth });
    await screen.findByText('pendiente@test.com');
    await userEvt.click(screen.getByText('Resend'));
    expect(invitationsApi.resendInvitation).toHaveBeenCalledWith(1);
  });

  it('calls cancelInvitation when Cancel is clicked', async () => {
    vi.mocked(invitationsApi.getInvitations).mockResolvedValue([pendingInvitation]);
    const userEvt = userEvent.setup();
    renderWithProviders(<UsersContainer />, { auth: ownerAuth });
    await screen.findByText('pendiente@test.com');
    await userEvt.click(screen.getByText('Cancel'));
    expect(invitationsApi.cancelInvitation).toHaveBeenCalledWith(1);
  });
});
