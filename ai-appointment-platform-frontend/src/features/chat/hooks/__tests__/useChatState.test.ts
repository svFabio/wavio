import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { useChatState } from '../useChatState';
import { useSocketEvent } from '../../../../shared/hooks/useSocketEvent';
import { chatApi } from '../../api/chat.api';
import { renderHookWithProviders } from '../../../../test-utils';
import type { MensajeChat, Conversacion } from '../../types';

vi.mock('../../../../shared/hooks/useSocketEvent', () => ({
  useSocketEvent: vi.fn(),
}));

vi.mock('../../api/chat.api', () => ({
  chatApi: {
    obtenerConversaciones: vi.fn(),
    obtenerMensajes: vi.fn(),
    enviarMensajeChat: vi.fn(),
    eliminarConversacion: vi.fn(),
  },
}));

type NuevoMensajePayload = { remoteJid: string; mensaje: MensajeChat };

const mensajeInicial: MensajeChat = {
  id: 1,
  remoteJid: 'jid1',
  contenido: 'anterior',
  direccion: 'ENTRANTE',
  timestamp: '2026-08-01T10:00:00.000Z',
};

const payload: NuevoMensajePayload = {
  remoteJid: 'jid1',
  mensaje: {
    id: 2,
    remoteJid: 'jid1',
    contenido: 'hola',
    direccion: 'ENTRANTE',
    timestamp: '2026-08-01T10:05:00.000Z',
  },
};

const conversacionInicial: Conversacion = {
  remoteJid: 'jid1',
  ultimoMensaje: mensajeInicial.timestamp,
  totalMensajes: 1,
  ultimoContenido: mensajeInicial.contenido,
  ultimaDireccion: mensajeInicial.direccion,
};

function getSocketHandler(event: string): (data: NuevoMensajePayload) => void {
  const call = vi.mocked(useSocketEvent).mock.calls.find(([evt]) => evt === event);
  if (!call) throw new Error(`useSocketEvent never subscribed to "${event}"`);
  return call[1] as (data: NuevoMensajePayload) => void;
}

describe('useChatState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chatApi.obtenerConversaciones).mockResolvedValue([conversacionInicial]);
    vi.mocked(chatApi.obtenerMensajes).mockResolvedValue([mensajeInicial]);
  });

  describe('handleNuevoMensaje (nuevo-mensaje socket)', () => {
    it('appends the nested mensaje to the selected conversation cache', async () => {
      const { result, queryClient } = renderHookWithProviders(() => useChatState());

      act(() => {
        result.current.setSelectedJid('jid1');
      });

      await waitFor(() => {
        expect(queryClient.getQueryData<MensajeChat[]>(['mensajes', 'jid1'])).toEqual([
          mensajeInicial,
        ]);
      });

      act(() => {
        getSocketHandler('nuevo-mensaje')(payload);
      });

      expect(queryClient.getQueryData<MensajeChat[]>(['mensajes', 'jid1'])).toEqual([
        mensajeInicial,
        payload.mensaje,
      ]);
    });

    it('updates the conversation list with the nested message content and re-sorts', async () => {
      const { queryClient } = renderHookWithProviders(() => useChatState());

      await waitFor(() => {
        expect(queryClient.getQueryData<Conversacion[]>(['conversaciones'])).toEqual([
          conversacionInicial,
        ]);
      });

      act(() => {
        getSocketHandler('nuevo-mensaje')(payload);
      });

      const conversaciones = queryClient.getQueryData<Conversacion[]>(['conversaciones']);
      expect(conversaciones).toHaveLength(1);
      expect(conversaciones![0]).toEqual({
        ...conversacionInicial,
        ultimoContenido: 'hola',
        ultimoMensaje: payload.mensaje.timestamp,
        ultimaDireccion: payload.mensaje.direccion,
        totalMensajes: 2,
      });
    });
  });
});
