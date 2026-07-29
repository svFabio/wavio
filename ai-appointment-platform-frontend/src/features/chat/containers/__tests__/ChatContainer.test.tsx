import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { ChatContainer } from '../ChatContainer.container';
import { chatApi } from '../../api/chat.api';

vi.mock('../../api/chat.api', () => ({
  chatApi: {
    obtenerConversaciones: vi.fn(),
    obtenerMensajes: vi.fn(),
    enviarMensajeChat: vi.fn(),
    eliminarConversacion: vi.fn(),
  },
}));

vi.mock('../../../../shared/hooks/useNotifications', () => ({
  useNotifications: () => ({
    showNotification: vi.fn(),
  }),
}));

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatApi.obtenerConversaciones).mockResolvedValue([]);
    vi.mocked(chatApi.obtenerMensajes).mockResolvedValue([]);
  });

  it('renders the chat view', async () => {
    renderWithProviders(<ChatContainer />);
    expect(screen.getByText('Chats de WhatsApp')).toBeInTheDocument();
  });
});
