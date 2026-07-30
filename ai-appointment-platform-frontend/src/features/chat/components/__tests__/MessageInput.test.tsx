import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  it('renders textarea and send button', () => {
    render(
      <MessageInput
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
        onKeyDown={vi.fn()}
        disabled={false}
      />,
    );
    expect(screen.getByPlaceholderText('Escribe un mensaje...')).toBeInTheDocument();
    expect(screen.getByLabelText('Enviar mensaje')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MessageInput
        value=""
        onChange={onChange}
        onSend={vi.fn()}
        onKeyDown={vi.fn()}
        disabled={false}
      />,
    );
    const textarea = screen.getByPlaceholderText('Escribe un mensaje...');
    await user.type(textarea, 'Hola');
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('calls onKeyDown on key press', async () => {
    const onKeyDown = vi.fn();
    const user = userEvent.setup();
    render(
      <MessageInput
        value="test"
        onChange={vi.fn()}
        onSend={vi.fn()}
        onKeyDown={onKeyDown}
        disabled={false}
      />,
    );
    const textarea = screen.getByPlaceholderText('Escribe un mensaje...');
    await user.type(textarea, '{enter}');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('calls onSend when button clicked and value is not empty', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(
      <MessageInput
        value="Hola"
        onChange={vi.fn()}
        onSend={onSend}
        onKeyDown={vi.fn()}
        disabled={false}
      />,
    );
    await user.click(screen.getByLabelText('Enviar mensaje'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('disables button when value is empty', () => {
    render(
      <MessageInput
        value=""
        onChange={vi.fn()}
        onSend={vi.fn()}
        onKeyDown={vi.fn()}
        disabled={false}
      />,
    );
    expect(screen.getByLabelText('Enviar mensaje')).toBeDisabled();
  });

  it('disables button when disabled prop is true', () => {
    render(
      <MessageInput
        value="Hola"
        onChange={vi.fn()}
        onSend={vi.fn()}
        onKeyDown={vi.fn()}
        disabled={true}
      />,
    );
    expect(screen.getByLabelText('Enviar mensaje')).toBeDisabled();
  });

  it('shows spinner when disabled and value is set', () => {
    render(
      <MessageInput
        value="Hola"
        onChange={vi.fn()}
        onSend={vi.fn()}
        onKeyDown={vi.fn()}
        disabled={true}
      />,
    );
    expect(screen.getByLabelText('Enviar mensaje')).toBeDisabled();
  });
});
