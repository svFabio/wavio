import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { WaitlistView } from '../WaitlistView';
import type { WaitlistEntry } from '../../types';

const entries: WaitlistEntry[] = [
  {
    id: 1,
    clienteNombre: 'Juan Perez',
    clienteTelefono: '59170000000',
    servicioId: null,
    fechaPreferida: '2026-02-10',
    horarioPreferido: '10:00',
    estado: 'PENDIENTE',
    creadoEn: '2026-01-15T00:00:00Z',
    notificadoEn: null,
  },
  {
    id: 2,
    clienteNombre: 'Maria Gomez',
    clienteTelefono: '59171111111',
    servicioId: null,
    fechaPreferida: '2026-02-12',
    horarioPreferido: null,
    estado: 'PENDIENTE',
    creadoEn: '2026-01-15T00:00:00Z',
    notificadoEn: '2026-01-16T00:00:00Z',
  },
];

describe('WaitlistView', () => {
  it('renders loading spinner', () => {
    render(
      <WaitlistView
        entries={[]}
        loading={true}
        error={null}
        isAdding={false}
        onToggleForm={vi.fn()}
        onAdd={vi.fn()}
        onNotify={vi.fn()}
        onRemove={vi.fn()}
        pendingNotifyId={null}
        pendingRemoveId={null}
      />,
    );
    expect(screen.getByText('Lista de Espera')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(
      <WaitlistView
        entries={[]}
        loading={false}
        error="Error cargando"
        isAdding={false}
        onToggleForm={vi.fn()}
        onAdd={vi.fn()}
        onNotify={vi.fn()}
        onRemove={vi.fn()}
        pendingNotifyId={null}
        pendingRemoveId={null}
      />,
    );
    expect(screen.getByText('Error cargando')).toBeInTheDocument();
  });

  it('renders empty state when no entries', () => {
    render(
      <WaitlistView
        entries={[]}
        loading={false}
        error={null}
        isAdding={false}
        onToggleForm={vi.fn()}
        onAdd={vi.fn()}
        onNotify={vi.fn()}
        onRemove={vi.fn()}
        pendingNotifyId={null}
        pendingRemoveId={null}
      />,
    );
    expect(screen.getByText('No hay entradas en este estado.')).toBeInTheDocument();
  });

  it('renders entries', () => {
    render(
      <WaitlistView
        entries={entries}
        loading={false}
        error={null}
        isAdding={false}
        onToggleForm={vi.fn()}
        onAdd={vi.fn()}
        onNotify={vi.fn()}
        onRemove={vi.fn()}
        pendingNotifyId={null}
        pendingRemoveId={null}
      />,
    );
    // Desktop table + mobile cards both render names
    expect(screen.getAllByText('Juan Perez')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Maria Gomez')[0]).toBeInTheDocument();
  });

  it('shows form when isAdding is true', () => {
    render(
      <WaitlistView
        entries={entries}
        loading={false}
        error={null}
        isAdding={true}
        onToggleForm={vi.fn()}
        onAdd={vi.fn()}
        onNotify={vi.fn()}
        onRemove={vi.fn()}
        pendingNotifyId={null}
        pendingRemoveId={null}
      />,
    );
    expect(screen.getByText('Agregar a lista de espera')).toBeInTheDocument();
  });

  it('calls onToggleForm when adding button clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <WaitlistView
        entries={[]}
        loading={false}
        error={null}
        isAdding={false}
        onToggleForm={onToggle}
        onAdd={vi.fn()}
        onNotify={vi.fn()}
        onRemove={vi.fn()}
        pendingNotifyId={null}
        pendingRemoveId={null}
      />,
    );
    await user.click(screen.getByText('Nuevo Registro'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
