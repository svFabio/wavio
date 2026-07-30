import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { WaitlistCard } from '../WaitlistCard';
import type { WaitlistEntry } from '../../types';

const entry: WaitlistEntry = {
  id: 1,
  clienteNombre: 'Juan Perez',
  clienteTelefono: '59170000000',
  servicioId: null,
  fechaPreferida: '2026-02-10',
  horarioPreferido: '10:00',
  estado: 'PENDIENTE',
  creadoEn: '2026-01-15T00:00:00Z',
  notificadoEn: null,
};

describe('WaitlistCard', () => {
  it('renders entry data', () => {
    render(
      <table>
        <tbody>
          <WaitlistCard
            entry={entry}
            onNotify={vi.fn()}
            onRemove={vi.fn()}
            isNotifying={false}
            isRemoving={false}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('59170000000')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('shows notify button for PENDIENTE state', () => {
    render(
      <table>
        <tbody>
          <WaitlistCard
            entry={entry}
            onNotify={vi.fn()}
            onRemove={vi.fn()}
            isNotifying={false}
            isRemoving={false}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByTitle('Notificar por WhatsApp')).toBeInTheDocument();
  });

  it('hides notify button for non-PENDIENTE state', () => {
    const confirmed = { ...entry, estado: 'CONFIRMADA' as const };
    render(
      <table>
        <tbody>
          <WaitlistCard
            entry={confirmed}
            onNotify={vi.fn()}
            onRemove={vi.fn()}
            isNotifying={false}
            isRemoving={false}
          />
        </tbody>
      </table>,
    );
    expect(screen.queryByTitle('Notificar por WhatsApp')).not.toBeInTheDocument();
  });

  it('disables notify button when isNotifying', () => {
    render(
      <table>
        <tbody>
          <WaitlistCard
            entry={entry}
            onNotify={vi.fn()}
            onRemove={vi.fn()}
            isNotifying={true}
            isRemoving={false}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByTitle('Notificar por WhatsApp')).toBeDisabled();
  });

  it('calls onNotify when notify button clicked', async () => {
    const onNotify = vi.fn();
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <WaitlistCard
            entry={entry}
            onNotify={onNotify}
            onRemove={vi.fn()}
            isNotifying={false}
            isRemoving={false}
          />
        </tbody>
      </table>,
    );
    await user.click(screen.getByTitle('Notificar por WhatsApp'));
    expect(onNotify).toHaveBeenCalledWith(1);
  });

  it('calls onRemove when delete button clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <table>
        <tbody>
          <WaitlistCard
            entry={entry}
            onNotify={vi.fn()}
            onRemove={onRemove}
            isNotifying={false}
            isRemoving={false}
          />
        </tbody>
      </table>,
    );
    await user.click(screen.getByTitle('Eliminar'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
