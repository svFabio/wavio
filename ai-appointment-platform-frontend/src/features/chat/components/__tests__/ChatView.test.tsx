import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChatView } from '../ChatView';
import type { MensajeChat, Conversacion } from '../../types';

const conversacion: Conversacion = {
  remoteJid: '111@s.whatsapp.net',
  ultimoMensaje: '2026-01-10T14:30:00Z',
  totalMensajes: 3,
  ultimoContenido: 'Hola',
  ultimaDireccion: 'ENTRANTE',
  clienteNombre: 'Juan Perez',
  telefonoReal: '59170000000',
};

const mensajes: MensajeChat[] = [
  {
    id: 1,
    remoteJid: '111@s.whatsapp.net',
    contenido: 'Hola',
    direccion: 'ENTRANTE',
    timestamp: '2026-01-10T14:30:00Z',
  },
];

const messagesEndRef = { current: null } as React.RefObject<HTMLDivElement | null>;
const formatJid = (jid: string) => jid.split('@')[0];
const formatTimestamp = (_ts: string) => '14:30';
const formatDate = (_ts: string) => '10 Ene';

describe('ChatView', () => {
  it('renders empty state when no conversation selected', () => {
    render(
      <ChatView
        conversacionesFiltradas={[]}
        selectedJid={null}
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={vi.fn()}
        mensajes={[]}
        loadingMensajes={false}
        selectedConversacion={undefined}
        messagesEndRef={messagesEndRef}
        nuevoMensaje=""
        enviando={false}
        onNuevoMensajeChange={vi.fn()}
        onEnviarMensaje={vi.fn()}
        onKeyDown={vi.fn()}
        onVolver={vi.fn()}
        formatJid={formatJid}
        formatTimestamp={formatTimestamp}
        formatDate={formatDate}
      />,
    );
    expect(screen.getByText('Selecciona una conversación')).toBeInTheDocument();
  });

  it('renders message panel when conversation selected', () => {
    render(
      <ChatView
        conversacionesFiltradas={[conversacion]}
        selectedJid="111@s.whatsapp.net"
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={vi.fn()}
        mensajes={mensajes}
        loadingMensajes={false}
        selectedConversacion={conversacion}
        messagesEndRef={messagesEndRef}
        nuevoMensaje=""
        enviando={false}
        onNuevoMensajeChange={vi.fn()}
        onEnviarMensaje={vi.fn()}
        onKeyDown={vi.fn()}
        onVolver={vi.fn()}
        formatJid={formatJid}
        formatTimestamp={formatTimestamp}
        formatDate={formatDate}
      />,
    );
    expect(screen.getAllByText('Juan Perez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hola').length).toBeGreaterThan(0);
  });

  it('calls onSelectConversacion when clicking a conversation', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatView
        conversacionesFiltradas={[conversacion]}
        selectedJid={null}
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={onSelect}
        onEliminarConversacion={vi.fn()}
        mensajes={[]}
        loadingMensajes={false}
        selectedConversacion={undefined}
        messagesEndRef={messagesEndRef}
        nuevoMensaje=""
        enviando={false}
        onNuevoMensajeChange={vi.fn()}
        onEnviarMensaje={vi.fn()}
        onKeyDown={vi.fn()}
        onVolver={vi.fn()}
        formatJid={formatJid}
        formatTimestamp={formatTimestamp}
        formatDate={formatDate}
      />,
    );
    await user.click(screen.getByText('Juan Perez'));
    expect(onSelect).toHaveBeenCalledWith('111@s.whatsapp.net');
  });
});
