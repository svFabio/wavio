import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { MensajeChat } from '../../types';

const formatTimestamp = (_ts: string) => '14:30';

const baseMessage: MensajeChat = {
  id: 1,
  remoteJid: '123@s.whatsapp.net',
  contenido: 'Hola, quiero agendar',
  direccion: 'ENTRANTE',
  timestamp: '2026-01-10T14:30:00Z',
};

describe('MessageBubble', () => {
  it('renders entrante message on the left', () => {
    render(<MessageBubble message={baseMessage} formatTimestamp={formatTimestamp} />);
    expect(screen.getByText('Hola, quiero agendar')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('renders saliente message on the right with checkmarks', () => {
    const msg: MensajeChat = { ...baseMessage, direccion: 'SALIENTE' };
    render(<MessageBubble message={msg} formatTimestamp={formatTimestamp} />);
    expect(screen.getByText('Hola, quiero agendar')).toBeInTheDocument();
  });

  it('displays timestamp from formatTimestamp', () => {
    const custom = (_ts: string) => '10:15 AM';
    render(<MessageBubble message={baseMessage} formatTimestamp={custom} />);
    expect(screen.getByText('10:15 AM')).toBeInTheDocument();
  });
});
