import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { chatApi } from '../chat.api';
import type { Conversacion, MensajeChat } from '../../../../types';

const BASE = '*/api/v1/chat';

const mockConversacion: Conversacion = {
  remoteJid: '111@s.whatsapp.net',
  ultimoMensaje: '2026-01-10T14:30:00Z',
  totalMensajes: 3,
  ultimoContenido: 'Hola',
  ultimaDireccion: 'ENTRANTE',
  clienteNombre: 'Juan Perez',
  telefonoReal: '59170000000',
};

const mockMensaje: MensajeChat = {
  id: 1,
  remoteJid: '111@s.whatsapp.net',
  contenido: 'Hola',
  direccion: 'ENTRANTE',
  timestamp: '2026-01-10T14:30:00Z',
};

beforeEach(() => {
  localStorage.clear();
});

describe('chatApi.obtenerConversaciones', () => {
  it('returns conversations from /chat/conversaciones', async () => {
    server.use(
      http.get(`${BASE}/conversaciones`, () =>
        HttpResponse.json({ data: [mockConversacion], pagination: {} }),
      ),
    );
    const result = await chatApi.obtenerConversaciones();
    expect(result).toEqual([mockConversacion]);
  });
});

describe('chatApi.obtenerMensajes', () => {
  it('returns messages from /chat/mensajes/:jid', async () => {
    server.use(
      http.get(`${BASE}/mensajes/:jid`, () =>
        HttpResponse.json({ data: [mockMensaje], pagination: {} }),
      ),
    );
    const result = await chatApi.obtenerMensajes('111@s.whatsapp.net');
    expect(result).toEqual([mockMensaje]);
  });
});

describe('chatApi.enviarMensajeChat', () => {
  it('returns success on POST /chat/enviar/:jid', async () => {
    server.use(http.post(`${BASE}/enviar/:jid`, () => HttpResponse.json({ success: true })));
    const result = await chatApi.enviarMensajeChat('111@s.whatsapp.net', 'Hola');
    expect(result).toEqual({ success: true });
  });

  it('returns error on failure', async () => {
    server.use(
      http.post(`${BASE}/enviar/:jid`, () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );
    const result = await chatApi.enviarMensajeChat('bad', 'Hola');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('chatApi.eliminarConversacion', () => {
  it('returns success on DELETE /chat/conversacion/:jid', async () => {
    server.use(
      http.delete(`${BASE}/conversacion/:jid`, () => HttpResponse.json({ success: true })),
    );
    const result = await chatApi.eliminarConversacion('111@s.whatsapp.net');
    expect(result).toEqual({ success: true });
  });

  it('returns error on failure', async () => {
    server.use(
      http.delete(`${BASE}/conversacion/:jid`, () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );
    const result = await chatApi.eliminarConversacion('bad');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
