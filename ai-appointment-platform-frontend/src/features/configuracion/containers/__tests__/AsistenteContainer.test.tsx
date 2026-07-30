import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { renderWithProviders } from '../../../../test-utils';
import { AsistenteContainer } from '../AsistenteContainer.container';

const mockConfig = {
  id: 1,
  trigger: '!cita',
  mensajeBienvenida: 'Bienvenido!',
  mensajeConfirmacion: 'Gracias por tu pago',
  qrFotoUrl: null,
  cobrarAdelanto: true,
  porcentajeAdelanto: 50,
  timezone: 'America/Mexico_City',
  chatFlow: [
    {
      id: 'bienvenida',
      titulo: '1. Bienvenida',
      mensaje: 'Hola!',
      tipoInput: 'texto' as const,
      activo: true,
    },
  ],
};

beforeEach(() => {
  server.use(
    http.get('*/api/v1/configuracion', () => HttpResponse.json(mockConfig)),
    http.patch('*/api/v1/configuracion', () => HttpResponse.json({ success: true })),
    http.post('*/api/v1/configuracion/qr', () =>
      HttpResponse.json({ qrFotoUrl: 'https://example.com/qr.png' }),
    ),
  );
});

describe('AsistenteContainer', () => {
  it('renders loading state', () => {
    server.use(http.get('*/api/v1/configuracion', () => new Promise(() => {})));
    const { container } = renderWithProviders(<AsistenteContainer />);
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('initializes state from config after loading', async () => {
    renderWithProviders(<AsistenteContainer />);
    await waitFor(() => {
      expect(screen.getByLabelText('Trigger')).toHaveValue('!cita');
    });
  });

  it('renders chat flow steps from config', async () => {
    renderWithProviders(<AsistenteContainer />);
    await waitFor(() => {
      expect(screen.getByText('1. Bienvenida')).toBeInTheDocument();
    });
  });

  it('shows porcentaje adelanto when cobrarAdelanto is true', async () => {
    renderWithProviders(<AsistenteContainer />);
    await waitFor(() => {
      expect(screen.getByLabelText('Porcentaje de adelanto')).toHaveValue(50);
    });
  });

  it('calls save mutation when save button is clicked', async () => {
    const user = userEvent.setup();
    let patchCalled = false;
    server.use(
      http.patch('*/api/v1/configuracion', () => {
        patchCalled = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<AsistenteContainer />);
    await waitFor(() => {
      expect(screen.getByLabelText('Trigger')).toHaveValue('!cita');
    });
    await user.click(screen.getByText('Guardar'));
    await waitFor(() => {
      expect(patchCalled).toBe(true);
    });
  });

  it('shows error when save fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch('*/api/v1/configuracion', () =>
        HttpResponse.json({ error: 'Save failed' }, { status: 400 }),
      ),
    );
    renderWithProviders(<AsistenteContainer />);
    await waitFor(() => {
      expect(screen.getByLabelText('Trigger')).toHaveValue('!cita');
    });
    await user.click(screen.getByText('Guardar'));
    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});
