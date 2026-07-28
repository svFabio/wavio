import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientInfoInputs } from '../ClientInfoInputs';

describe('ClientInfoInputs', () => {
  it('renders nombre and telefono labels', () => {
    render(
      <ClientInfoInputs
        nombre=""
        telefono=""
        onNombreChange={vi.fn()}
        onTelefonoChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Nombre del Cliente *')).toBeInTheDocument();
    expect(screen.getByText('Telefono *')).toBeInTheDocument();
  });

  it('displays the provided nombre and telefono values', () => {
    render(
      <ClientInfoInputs
        nombre="Ana Lopez"
        telefono="591700000"
        onNombreChange={vi.fn()}
        onTelefonoChange={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Ana Lopez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('591700000')).toBeInTheDocument();
  });

  it('calls onNombreChange when nombre input changes', async () => {
    const user = userEvent.setup();
    const onNombreChange = vi.fn();
    render(
      <ClientInfoInputs
        nombre=""
        telefono=""
        onNombreChange={onNombreChange}
        onTelefonoChange={vi.fn()}
      />,
    );
    const nombreInput = screen.getByPlaceholderText('Ej: Juan Perez');
    await user.type(nombreInput, 'Carlos');
    expect(onNombreChange).toHaveBeenCalled();
    expect(onNombreChange).toHaveBeenLastCalledWith('Carlos');
  });

  it('strips non-numeric characters from telefono input', async () => {
    const user = userEvent.setup();
    const onTelefonoChange = vi.fn();
    render(
      <ClientInfoInputs
        nombre=""
        telefono=""
        onNombreChange={vi.fn()}
        onTelefonoChange={onTelefonoChange}
      />,
    );
    const telInput = screen.getByPlaceholderText('Ej: 591 70000000');
    await user.type(telInput, '591abc70');
    // Each character fires a change; last call should be digits only
    const calls = onTelefonoChange.mock.calls.map(([v]) => v);
    calls.forEach((v) => {
      expect(/^\d*$/.test(v)).toBe(true);
    });
  });

  it('calls onTelefonoChange with only digits', async () => {
    const user = userEvent.setup();
    const onTelefonoChange = vi.fn();
    render(
      <ClientInfoInputs
        nombre=""
        telefono=""
        onNombreChange={vi.fn()}
        onTelefonoChange={onTelefonoChange}
      />,
    );
    const telInput = screen.getByPlaceholderText('Ej: 591 70000000');
    await user.type(telInput, '123');
    expect(onTelefonoChange).toHaveBeenLastCalledWith('123');
  });
});
