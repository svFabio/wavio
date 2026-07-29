import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { WaitlistForm } from '../WaitlistForm';

describe('WaitlistForm', () => {
  it('renders form fields', () => {
    render(<WaitlistForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={false} />);
    expect(screen.getByPlaceholderText('Nombre del cliente')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('591 70000000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar a la Lista' })).toBeInTheDocument();
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<WaitlistForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />);

    await user.type(screen.getByPlaceholderText('Nombre del cliente'), 'Juan Perez');
    await user.type(screen.getByPlaceholderText('591 70000000'), '59170000000');
    await user.click(screen.getByRole('button', { name: 'Agregar a la Lista' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteNombre: 'Juan Perez',
        clienteTelefono: '59170000000',
      }),
    );
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<WaitlistForm onSubmit={vi.fn()} onCancel={onCancel} isLoading={false} />);
    await user.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit when isLoading', () => {
    render(<WaitlistForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: 'Agregar a la Lista' })).toBeDisabled();
  });
});
