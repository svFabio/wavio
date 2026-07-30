import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ConversationList } from '../ConversationList';
import type { Conversacion } from '../../types';

const mockConversaciones: Conversacion[] = [
  {
    remoteJid: '111@s.whatsapp.net',
    ultimoMensaje: '2026-01-10T14:30:00Z',
    totalMensajes: 3,
    ultimoContenido: 'Hola',
    ultimaDireccion: 'ENTRANTE',
    clienteNombre: 'Juan Perez',
    telefonoReal: '59170000000',
  },
  {
    remoteJid: '222@s.whatsapp.net',
    ultimoMensaje: '2026-01-10T10:00:00Z',
    totalMensajes: 1,
    ultimoContenido: 'Gracias',
    ultimaDireccion: 'SALIENTE',
    clienteNombre: null,
    telefonoReal: '59171111111',
  },
];

const formatJid = (jid: string) => jid.split('@')[0];
const formatDate = (_ts: string) => '10 Ene, 14:30';

describe('ConversationList', () => {
  it('renders loading skeletons', () => {
    render(
      <ConversationList
        conversaciones={[]}
        selectedJid={null}
        loading={true}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={vi.fn()}
        formatJid={formatJid}
        formatDate={formatDate}
      />,
    );
    expect(screen.getByText('Chats de WhatsApp')).toBeInTheDocument();
  });

  it('renders empty state when no conversations', () => {
    render(
      <ConversationList
        conversaciones={[]}
        selectedJid={null}
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={vi.fn()}
        formatJid={formatJid}
        formatDate={formatDate}
      />,
    );
    expect(screen.getByText('No hay conversaciones aun')).toBeInTheDocument();
  });

  it('renders list of conversations', () => {
    render(
      <ConversationList
        conversaciones={mockConversaciones}
        selectedJid={null}
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={vi.fn()}
        formatJid={formatJid}
        formatDate={formatDate}
      />,
    );
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('59170000000')).toBeInTheDocument();
  });

  it('calls onSelectConversacion when clicking a conversation', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <ConversationList
        conversaciones={mockConversaciones}
        selectedJid={null}
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={onSelect}
        onEliminarConversacion={vi.fn()}
        formatJid={formatJid}
        formatDate={formatDate}
      />,
    );
    await user.click(screen.getByText('Juan Perez'));
    expect(onSelect).toHaveBeenCalledWith('111@s.whatsapp.net');
  });

  it('calls onEliminarConversacion when clicking delete', async () => {
    const onEliminar = vi.fn();
    const user = userEvent.setup();
    render(
      <ConversationList
        conversaciones={mockConversaciones}
        selectedJid={null}
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={onEliminar}
        formatJid={formatJid}
        formatDate={formatDate}
      />,
    );
    const deleteButtons = screen.getAllByLabelText('Eliminar conversacion');
    await user.click(deleteButtons[0]);
    expect(onEliminar).toHaveBeenCalledTimes(1);
    expect(onEliminar).toHaveBeenCalledWith(expect.any(Object), '111@s.whatsapp.net');
  });

  it('calls onBusquedaChange when typing', async () => {
    const onBusquedaChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ConversationList
        conversaciones={mockConversaciones}
        selectedJid={null}
        loading={false}
        busqueda=""
        onBusquedaChange={onBusquedaChange}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={vi.fn()}
        formatJid={formatJid}
        formatDate={formatDate}
      />,
    );
    const searchInput = screen.getByPlaceholderText('Buscar por nombre o numero...');
    await user.type(searchInput, 'Juan');
    expect(onBusquedaChange).toHaveBeenCalledTimes(4);
  });

  it('highlights selected conversation', () => {
    render(
      <ConversationList
        conversaciones={mockConversaciones}
        selectedJid="111@s.whatsapp.net"
        loading={false}
        busqueda=""
        onBusquedaChange={vi.fn()}
        onSelectConversacion={vi.fn()}
        onEliminarConversacion={vi.fn()}
        formatJid={formatJid}
        formatDate={formatDate}
      />,
    );
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });
});
