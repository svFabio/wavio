import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { renderWithProviders } from '../../../../test-utils';
import { AdminWhatsapp } from '../AdminWhatsapp';

beforeEach(() => {
  window.FB = undefined as unknown as typeof window.FB;
  window.confirm = vi.fn(() => true);
});

describe('AdminWhatsapp', () => {
  it('shows loading state', () => {
    server.use(http.get('*/api/v1/whatsapp/status', () => new Promise(() => {})));
    const { container } = renderWithProviders(<AdminWhatsapp />);
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('shows connected state', async () => {
    server.use(
      http.get('*/api/v1/whatsapp/status', () =>
        HttpResponse.json({ connected: true, phone: '12345' }),
      ),
    );
    renderWithProviders(<AdminWhatsapp />);
    await waitFor(() => {
      expect(screen.getByText('Conectado a Meta Oficial')).toBeInTheDocument();
    });
    expect(screen.getByText('Desvincular')).toBeInTheDocument();
  });

  it('shows disconnect button and handles it', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/api/v1/whatsapp/status', () =>
        HttpResponse.json({ connected: true, phone: '12345' }),
      ),
      http.post('*/api/v1/whatsapp/disconnect', () => HttpResponse.json({ success: true })),
    );
    renderWithProviders(<AdminWhatsapp />);
    await waitFor(() => {
      expect(screen.getByText('Desvincular')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Desvincular'));
    expect(window.confirm).toHaveBeenCalled();
  });

  it('shows disconnected state with dev form', async () => {
    server.use(http.get('*/api/v1/whatsapp/status', () => HttpResponse.json({ connected: false })));
    renderWithProviders(<AdminWhatsapp />);
    await waitFor(() => {
      expect(screen.getByText('Conectar con Facebook')).toBeInTheDocument();
    });
    expect(screen.getByText('Modo Desarrollo')).toBeInTheDocument();
  });

  it('shows Facebook SDK error when FB is not loaded', async () => {
    renderWithProviders(<AdminWhatsapp />);
    await waitFor(() => {
      expect(screen.getByText('Conectar con Facebook')).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByText('Conectar con Facebook'));
    expect(
      screen.getByText(
        'El SDK de Facebook no se ha cargado. Verifica tu conexion o deshabilita adblockers.',
      ),
    ).toBeInTheDocument();
  });

  it('shows no alert when no error is set', async () => {
    server.use(http.get('*/api/v1/whatsapp/status', () => HttpResponse.json({ connected: false })));
    renderWithProviders(<AdminWhatsapp />);
    await waitFor(() => {
      expect(screen.getByText('Conectar con Facebook')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
