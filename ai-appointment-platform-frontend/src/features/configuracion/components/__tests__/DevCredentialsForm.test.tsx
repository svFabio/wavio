import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DevCredentialsForm } from '../DevCredentialsForm';

describe('DevCredentialsForm', () => {
  it('renders all inputs and button', () => {
    render(
      <DevCredentialsForm
        devToken=""
        onTokenChange={vi.fn()}
        devPhoneId=""
        onPhoneIdChange={vi.fn()}
        devWabaId=""
        onWabaIdChange={vi.fn()}
        onSave={vi.fn()}
        saving={false}
        disabled={true}
      />,
    );
    expect(screen.getByLabelText('Access Token Permanente')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number ID')).toBeInTheDocument();
    expect(screen.getByLabelText('WABA ID')).toBeInTheDocument();
    expect(screen.getByText('Guardar Credenciales')).toBeInTheDocument();
  });

  it('calls onTokenChange when token input changes', async () => {
    const user = userEvent.setup();
    const onTokenChange = vi.fn();
    render(
      <DevCredentialsForm
        devToken=""
        onTokenChange={onTokenChange}
        devPhoneId=""
        onPhoneIdChange={vi.fn()}
        devWabaId=""
        onWabaIdChange={vi.fn()}
        onSave={vi.fn()}
        saving={false}
        disabled={true}
      />,
    );
    const tokenInput = screen.getByLabelText('Access Token Permanente');
    await user.type(tokenInput, 'a');
    expect(onTokenChange).toHaveBeenCalledWith('a');
  });

  it('calls onPhoneIdChange when phone input changes', async () => {
    const user = userEvent.setup();
    const onPhoneIdChange = vi.fn();
    render(
      <DevCredentialsForm
        devToken=""
        onTokenChange={vi.fn()}
        devPhoneId=""
        onPhoneIdChange={onPhoneIdChange}
        devWabaId=""
        onWabaIdChange={vi.fn()}
        onSave={vi.fn()}
        saving={false}
        disabled={true}
      />,
    );
    const phoneInput = screen.getByLabelText('Phone Number ID');
    await user.type(phoneInput, '1');
    expect(onPhoneIdChange).toHaveBeenCalledWith('1');
  });

  it('calls onWabaIdChange when waba input changes', async () => {
    const user = userEvent.setup();
    const onWabaIdChange = vi.fn();
    render(
      <DevCredentialsForm
        devToken=""
        onTokenChange={vi.fn()}
        devPhoneId=""
        onPhoneIdChange={vi.fn()}
        devWabaId=""
        onWabaIdChange={onWabaIdChange}
        onSave={vi.fn()}
        saving={false}
        disabled={true}
      />,
    );
    const wabaInput = screen.getByLabelText('WABA ID');
    await user.type(wabaInput, 'w');
    expect(onWabaIdChange).toHaveBeenCalledWith('w');
  });

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <DevCredentialsForm
        devToken="tok"
        onTokenChange={vi.fn()}
        devPhoneId="ph"
        onPhoneIdChange={vi.fn()}
        devWabaId="wa"
        onWabaIdChange={vi.fn()}
        onSave={onSave}
        saving={false}
        disabled={false}
      />,
    );
    await user.click(screen.getByText('Guardar Credenciales'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled is true', () => {
    render(
      <DevCredentialsForm
        devToken=""
        onTokenChange={vi.fn()}
        devPhoneId=""
        onPhoneIdChange={vi.fn()}
        devWabaId=""
        onWabaIdChange={vi.fn()}
        onSave={vi.fn()}
        saving={false}
        disabled={true}
      />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows saving text when saving is true', () => {
    render(
      <DevCredentialsForm
        devToken="tok"
        onTokenChange={vi.fn()}
        devPhoneId="ph"
        onPhoneIdChange={vi.fn()}
        devWabaId="wa"
        onWabaIdChange={vi.fn()}
        onSave={vi.fn()}
        saving={true}
        disabled={true}
      />,
    );
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });
});
