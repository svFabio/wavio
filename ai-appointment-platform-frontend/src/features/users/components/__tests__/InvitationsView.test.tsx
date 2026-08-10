import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { InvitationsView } from '../InvitationsView';
import type { Invitation } from '../../types';

const invitations: Invitation[] = [
  {
    id: 1,
    email: 'pendiente@test.com',
    rol: 'STAFF',
    estado: 'PENDIENTE',
    expiraEn: '2026-01-10T00:00:00Z',
    creadoEn: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    email: 'aceptada@test.com',
    rol: 'ADMIN',
    estado: 'ACEPTADA',
    expiraEn: '2026-01-10T00:00:00Z',
    creadoEn: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    email: 'cancelada@test.com',
    rol: 'STAFF',
    estado: 'CANCELADA',
    expiraEn: '2026-01-10T00:00:00Z',
    creadoEn: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    email: 'expirada@test.com',
    rol: 'STAFF',
    estado: 'EXPIRADA',
    expiraEn: '2025-12-01T00:00:00Z',
    creadoEn: '2025-11-01T00:00:00Z',
  },
];

describe('InvitationsView', () => {
  it('renders a row per invitation with its estado label', () => {
    render(<InvitationsView invitations={invitations} onResend={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('pendiente@test.com')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('aceptada@test.com')).toBeInTheDocument();
    expect(screen.getByText('Aceptada')).toBeInTheDocument();
    expect(screen.getByText('cancelada@test.com')).toBeInTheDocument();
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.getByText('expirada@test.com')).toBeInTheDocument();
    expect(screen.getByText('Expirada')).toBeInTheDocument();
  });

  it('shows Resend and Cancel actions only for PENDIENTE invitations', () => {
    render(<InvitationsView invitations={invitations} onResend={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Reenviar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    // Only one row is PENDIENTE, so the actions must appear exactly once
    expect(screen.getAllByText('Reenviar')).toHaveLength(1);
    expect(screen.getAllByText('Cancelar')).toHaveLength(1);
  });

  it('calls onResend with the invitation id', async () => {
    const onResend = vi.fn();
    const userEvt = userEvent.setup();
    render(<InvitationsView invitations={invitations} onResend={onResend} onCancel={vi.fn()} />);
    await userEvt.click(screen.getByText('Reenviar'));
    expect(onResend).toHaveBeenCalledWith(1);
  });

  it('calls onCancel with the invitation id', async () => {
    const onCancel = vi.fn();
    const userEvt = userEvent.setup();
    render(<InvitationsView invitations={invitations} onResend={vi.fn()} onCancel={onCancel} />);
    await userEvt.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledWith(1);
  });

  it('shows the empty state when there are no invitations', () => {
    render(<InvitationsView invitations={[]} onResend={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Sin invitaciones pendientes')).toBeInTheDocument();
  });
});
