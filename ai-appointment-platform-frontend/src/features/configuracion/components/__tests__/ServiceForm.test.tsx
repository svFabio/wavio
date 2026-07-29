import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ServiceForm } from '../ServiceForm';

const defaultService = {
  nombre: '',
  categoria: '',
  duracionMinutos: 60,
  bufferMinutos: 10,
  precio: 0,
};

describe('ServiceForm', () => {
  it('renders all fields and buttons', () => {
    render(
      <ServiceForm
        newService={defaultService}
        setNewService={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByPlaceholderText('Ej. Masaje Relajante')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. Faciales')).toBeInTheDocument();
    expect(screen.getByText('Guardar Servicio')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('calls setNewService on nombre change', async () => {
    const user = userEvent.setup();
    const setNewService = vi.fn();
    render(
      <ServiceForm
        newService={defaultService}
        setNewService={setNewService}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );
    const nombreInput = screen.getByPlaceholderText('Ej. Masaje Relajante');
    await user.type(nombreInput, 'C');
    expect(setNewService).toHaveBeenCalledWith({ ...defaultService, nombre: 'C' });
  });

  it('calls onSubmit on form submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ServiceForm
        newService={{ ...defaultService, nombre: 'Test' }}
        setNewService={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );
    const submitBtn = screen.getByText('Guardar Servicio');
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ServiceForm
        newService={defaultService}
        setNewService={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={onCancel}
        isLoading={false}
      />,
    );
    await user.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isLoading', () => {
    render(
      <ServiceForm
        newService={defaultService}
        setNewService={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading={true}
      />,
    );
    expect(screen.getByRole('button', { name: 'Guardar Servicio' })).toBeDisabled();
  });

  it('sets precio stripping non-numeric characters', async () => {
    const user = userEvent.setup();
    const setNewService = vi.fn();
    render(
      <ServiceForm
        newService={defaultService}
        setNewService={setNewService}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );
    const precioInput = screen.getByPlaceholderText('0');
    await user.type(precioInput, '1');
    expect(setNewService).toHaveBeenCalledWith({ ...defaultService, precio: 1 });
  });
});
