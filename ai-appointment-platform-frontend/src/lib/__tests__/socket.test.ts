import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSocket, connectSocket, disconnectSocket, switchSocketNegocio } from '../socket';
import { auth } from '../auth';
import { io } from 'socket.io-client';

vi.mock('socket.io-client', () => {
  const mSocket: Record<string, unknown> = {
    connected: false,
    auth: {},
  };
  mSocket.disconnect = vi.fn(() => mSocket);
  mSocket.connect = vi.fn(() => mSocket);
  return { io: vi.fn(() => mSocket) };
});

vi.mock('../auth', () => ({
  auth: {
    getToken: vi.fn(),
    getActiveNegocioId: vi.fn(),
  },
}));

describe('socket manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a singleton instance', () => {
    const socket1 = getSocket();
    const socket2 = getSocket();
    expect(socket1).toBe(socket2);
    expect(io).toHaveBeenCalledTimes(1);
  });

  it('connects with auth token and negocio id', () => {
    vi.mocked(auth.getToken).mockReturnValue('token-123');
    vi.mocked(auth.getActiveNegocioId).mockReturnValue(1);

    connectSocket();

    const socket = getSocket();
    expect(socket.auth).toEqual({
      token: 'token-123',
      negocioId: 1,
    });
    expect(socket.connect).toHaveBeenCalled();
  });

  it('disconnects socket', () => {
    const socket = getSocket();
    disconnectSocket();
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('switches negocio, updates socket.auth and forces reconnection', () => {
    vi.mocked(auth.getToken).mockReturnValue('token-456');

    switchSocketNegocio(5);

    const socket = getSocket();
    expect(socket.auth).toEqual({
      token: 'token-456',
      negocioId: 5,
    });
    expect(socket.disconnect).toHaveBeenCalled();
    expect(socket.connect).toHaveBeenCalled();
  });
});
