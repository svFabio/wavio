import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PagosView } from '../PagosView';

const citas = [
  {
    id: 'cita-1',
    clienteNombre: 'Juan Perez',
    clienteTelefono: '59170000000',
    horario: '10:00',
    estado: 'PENDIENTE_PAGO',
    comprobanteUrl: 'https://example.com/img.jpg',
  },
];

describe('PagosView', () => {
  it('renders loading skeleton', () => {
    const { container } = render(<PagosView citas={[]} loading={true} onValidar={vi.fn()} />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state', () => {
    render(<PagosView citas={[]} loading={false} onValidar={vi.fn()} />);
    expect(screen.getByText('Todo al dia!')).toBeInTheDocument();
  });

  it('renders cita list', () => {
    render(<PagosView citas={citas} loading={false} onValidar={vi.fn()} />);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('APROBAR')).toBeInTheDocument();
    expect(screen.getByText('RECHAZAR')).toBeInTheDocument();
  });

  it('shows pending count badge', () => {
    render(<PagosView citas={citas} loading={false} onValidar={vi.fn()} />);
    expect(screen.getByText('1 pendientes')).toBeInTheDocument();
  });

  it('calls onValidar with APROBAR', async () => {
    const onValidar = vi.fn();
    const user = userEvent.setup();
    render(<PagosView citas={citas} loading={false} onValidar={onValidar} />);
    await user.click(screen.getByText('APROBAR'));
    expect(onValidar).toHaveBeenCalledWith('cita-1', 'APROBAR');
  });

  it('calls onValidar with RECHAZAR', async () => {
    const onValidar = vi.fn();
    const user = userEvent.setup();
    render(<PagosView citas={citas} loading={false} onValidar={onValidar} />);
    await user.click(screen.getByText('RECHAZAR'));
    expect(onValidar).toHaveBeenCalledWith('cita-1', 'RECHAZAR');
  });

  it('disables approve button when no comprobante', () => {
    const noComprobante = [{ ...citas[0], comprobanteUrl: undefined }];
    render(<PagosView citas={noComprobante} loading={false} onValidar={vi.fn()} />);
    const approveBtn = screen.getByText('APROBAR').closest('button');
    expect(approveBtn).toBeDisabled();
  });
});
