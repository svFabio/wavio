import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderHookWithProviders } from '../../../../test-utils';
import { useChatState, formatJid, formatTimestamp, formatDate } from '../useChatState';
import { chatApi } from '../../api/chat.api';

vi.mock('../../api/chat.api', () => ({
  chatApi: {
    obtenerConversaciones: vi.fn(),
    obtenerMensajes: vi.fn(),
    enviarMensajeChat: vi.fn(),
    eliminarConversacion: vi.fn(),
  },
}));

describe('formatJid', () => {
  it('extracts phone from jid', () => {
    expect(formatJid('59170000000@s.whatsapp.net')).toBe('59170000000');
  });
});

describe('formatTimestamp', () => {
  it('formats a valid timestamp', () => {
    const result = formatTimestamp('2026-01-10T14:30:00Z');
    expect(result).toBe('10:30');
  });

  it('returns empty for invalid date', () => {
    expect(formatTimestamp('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a valid date', () => {
    const result = formatDate('2026-01-10T14:30:00Z');
    expect(result).toContain('10');
  });

  it('returns empty for invalid date', () => {
    expect(formatDate('')).toBe('');
  });
});

describe('useChatState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state with empty data', () => {
    vi.mocked(chatApi.obtenerConversaciones).mockResolvedValue([]);
    vi.mocked(chatApi.obtenerMensajes).mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useChatState());
    expect(result.current.busqueda).toBe('');
    expect(result.current.nuevoMensaje).toBe('');
    expect(result.current.selectedJid).toBeNull();
    expect(result.current.enviando).toBe(false);
  });

  it('filters conversations by search term', async () => {
    vi.mocked(chatApi.obtenerConversaciones).mockResolvedValue([
      {
        remoteJid: '111@s.whatsapp.net',
        ultimoMensaje: '2026-01-10T14:30:00Z',
        totalMensajes: 1,
        ultimoContenido: 'Hola',
        ultimaDireccion: 'ENTRANTE',
        clienteNombre: 'Juan Perez',
      },
      {
        remoteJid: '222@s.whatsapp.net',
        ultimoMensaje: '2026-01-10T10:00:00Z',
        totalMensajes: 1,
        ultimoContenido: 'Adios',
        ultimaDireccion: 'SALIENTE',
        clienteNombre: null,
      },
    ]);
    vi.mocked(chatApi.obtenerMensajes).mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useChatState());
    await vi.waitFor(() => {
      expect(result.current.conversacionesFiltradas).toHaveLength(2);
    });
  });

  it('provides setSelectedJid', async () => {
    vi.mocked(chatApi.obtenerConversaciones).mockResolvedValue([]);
    vi.mocked(chatApi.obtenerMensajes).mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useChatState());
    await act(async () => {
      result.current.setSelectedJid('111@s.whatsapp.net');
    });
    expect(result.current.selectedJid).toBe('111@s.whatsapp.net');
  });

  it('provides setBusqueda', async () => {
    vi.mocked(chatApi.obtenerConversaciones).mockResolvedValue([]);
    vi.mocked(chatApi.obtenerMensajes).mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useChatState());
    await act(async () => {
      result.current.setBusqueda('Juan');
    });
    expect(result.current.busqueda).toBe('Juan');
  });

  it('provides setNuevoMensaje and setEnviando', async () => {
    vi.mocked(chatApi.obtenerConversaciones).mockResolvedValue([]);
    vi.mocked(chatApi.obtenerMensajes).mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useChatState());
    await act(async () => {
      result.current.setNuevoMensaje('Hola');
      result.current.setEnviando(true);
    });
    expect(result.current.nuevoMensaje).toBe('Hola');
    expect(result.current.enviando).toBe(true);
  });
});
