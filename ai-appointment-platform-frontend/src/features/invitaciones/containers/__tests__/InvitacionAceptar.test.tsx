import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { InvitacionAceptarContainer } from '../InvitacionAceptar.container';

vi.mock('../../api/invitaciones.api', () => ({
  aceptarInvitacion: vi.fn(),
}));

import { aceptarInvitacion } from '../../api/invitaciones.api';

const mockAceptar = vi.mocked(aceptarInvitacion);

const renderAtRoute = (route: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/invitaciones/aceptar/:token" element={<InvitacionAceptarContainer />} />
    </Routes>,
    { route },
  );

describe('InvitacionAceptarContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the accept form when a token is present in the route', () => {
    renderAtRoute('/invitaciones/aceptar/tok123');
    expect(screen.getByText('Join your team')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Accept invitation')).toBeInTheDocument();
  });

  it('submits POST /invitaciones/aceptar with the token and form data', async () => {
    mockAceptar.mockResolvedValue({
      ok: true,
      usuario: { id: 9, nombre: 'Juan', email: 'j@t.com', rol: 'STAFF' },
    });
    const userEvt = userEvent.setup();
    renderAtRoute('/invitaciones/aceptar/tok123');
    await userEvt.type(screen.getByLabelText('Full name'), 'Juan');
    await userEvt.type(screen.getByLabelText('Password'), 'secret1');
    await userEvt.click(screen.getByText('Accept invitation'));

    await waitFor(() => {
      expect(mockAceptar).toHaveBeenCalledWith('tok123', {
        nombre: 'Juan',
        password: 'secret1',
      });
    });
  });

  it('shows the success panel with a login link after a successful accept', async () => {
    mockAceptar.mockResolvedValue({
      ok: true,
      usuario: { id: 9, nombre: 'Juan', email: 'j@t.com', rol: 'STAFF' },
    });
    const userEvt = userEvent.setup();
    renderAtRoute('/invitaciones/aceptar/tok123');
    await userEvt.type(screen.getByLabelText('Full name'), 'Juan');
    await userEvt.type(screen.getByLabelText('Password'), 'secret1');
    await userEvt.click(screen.getByText('Accept invitation'));

    expect(await screen.findByText('Account created')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to login' })).toBeInTheDocument();
  });

  it('shows the API error message when the accept request fails', async () => {
    mockAceptar.mockRejectedValue(new Error('La invitación no es válida o expiró'));
    const userEvt = userEvent.setup();
    renderAtRoute('/invitaciones/aceptar/tok123');
    await userEvt.type(screen.getByLabelText('Full name'), 'Juan');
    await userEvt.type(screen.getByLabelText('Password'), 'secret1');
    await userEvt.click(screen.getByText('Accept invitation'));

    expect(await screen.findByText('La invitación no es válida o expiró')).toBeInTheDocument();
  });

  it('shows the invalid link state when no token is present', () => {
    renderWithProviders(
      <Routes>
        <Route path="*" element={<InvitacionAceptarContainer />} />
      </Routes>,
      { route: '/' },
    );
    expect(screen.getByText('Invalid invitation link')).toBeInTheDocument();
  });
});
