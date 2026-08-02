import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ValidationCard } from '../ValidationCard';
import type { Cita } from '../../../../types';

const cita: Cita = {
  id: 'abc-123',
  clienteNombre: 'Juan Perez',
  clienteTelefono: '59170000000',
  fecha: '2026-02-01',
  horario: '10:00',
  servicio: 'Corte',
  estado: 'PENDIENTE_PAGO',
  origen: 'virtual',
  creadoEn: '2026-01-15T00:00:00Z',
  comprobanteUrl: 'https://example.com/comprobante.jpg',
};

describe('ValidationCard', () => {
  it('renders cita data', () => {
    render(<ValidationCard cita={cita} onAction={vi.fn()} />);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText(/59170000000/)).toBeInTheDocument();
    expect(screen.getByText('2026-02-01')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders without comprobante image', () => {
    const noComprobante = { ...cita, comprobanteUrl: undefined };
    render(<ValidationCard cita={noComprobante} onAction={vi.fn()} />);
    expect(screen.getByText('Sin imagen cargada')).toBeInTheDocument();
  });

  it('calls onAction with APROBAR', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<ValidationCard cita={cita} onAction={onAction} />);
    await user.click(screen.getByText('Validar'));
    expect(onAction).toHaveBeenCalledWith('abc-123', 'APROBAR');
  });

  it('calls onAction with RECHAZAR', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<ValidationCard cita={cita} onAction={onAction} />);
    await user.click(screen.getByText('Rechazar'));
    expect(onAction).toHaveBeenCalledWith('abc-123', 'RECHAZAR');
  });
});
