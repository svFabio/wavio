import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MessagePanel } from '../MessagePanel';
import type { MensajeChat, Conversacion } from '../../types';

const conversation: Conversacion = {
  remoteJid: '111@s.whatsapp.net',
  ultimoMensaje: '2026-01-10T14:30:00Z',
  totalMensajes: 3,
  ultimoContenido: 'Hola',
  ultimaDireccion: 'ENTRANTE',
  clienteNombre: 'Juan Perez',
  telefonoReal: '59170000000',
};

const messages: MensajeChat[] = [
  {
    id: 1,
    remoteJid: '111@s.whatsapp.net',
    contenido: 'Hola',
    direccion: 'ENTRANTE',
    timestamp: '2026-01-10T14:30:00Z',
  },
  {
    id: 2,
    remoteJid: '111@s.whatsapp.net',
    contenido: 'Bienvenido',
    direccion: 'SALIENTE',
    timestamp: '2026-01-10T14:31:00Z',
  },
];

const formatJid = (jid: string) => jid.split('@')[0];
const formatTimestamp = (_ts: string) => '14:30';
const messagesEndRef = { current: null } as React.RefObject<HTMLDivElement | null>;

const makeInput = () => ({
  value: '',
  disabled: false,
  onChange: vi.fn(),
  onSend: vi.fn(),
  onKeyDown: vi.fn(),
});

describe('MessagePanel', () => {
  it('renders conversation header', () => {
    render(
      <MessagePanel
        mensajes={messages}
        loadingMensajes={false}
        selectedConversacion={conversation}
        messagesEndRef={messagesEndRef}
        onVolver={vi.fn()}
        formatJid={formatJid}
        formatTimestamp={formatTimestamp}
        input={makeInput()}
      />,
    );
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('59170000000')).toBeInTheDocument();
  });

  it('renders loading skeletons', () => {
    render(
      <MessagePanel
        mensajes={[]}
        loadingMensajes={true}
        selectedConversacion={conversation}
        messagesEndRef={messagesEndRef}
        onVolver={vi.fn()}
        formatJid={formatJid}
        formatTimestamp={formatTimestamp}
        input={makeInput()}
      />,
    );
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('renders messages', () => {
    render(
      <MessagePanel
        mensajes={messages}
        loadingMensajes={false}
        selectedConversacion={conversation}
        messagesEndRef={messagesEndRef}
        onVolver={vi.fn()}
        formatJid={formatJid}
        formatTimestamp={formatTimestamp}
        input={makeInput()}
      />,
    );
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Bienvenido')).toBeInTheDocument();
  });

  it('calls onVolver when back button clicked', async () => {
    const onVolver = vi.fn();
    const user = userEvent.setup();
    render(
      <MessagePanel
        mensajes={messages}
        loadingMensajes={false}
        selectedConversacion={conversation}
        messagesEndRef={messagesEndRef}
        onVolver={onVolver}
        formatJid={formatJid}
        formatTimestamp={formatTimestamp}
        input={makeInput()}
      />,
    );
    await user.click(screen.getByLabelText('Volver a conversaciones'));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });
});
