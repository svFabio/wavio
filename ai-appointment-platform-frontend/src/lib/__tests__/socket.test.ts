import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSocket, connectSocket, disconnectSocket } from '../socket';
import { auth } from '../auth';
import { io } from 'socket.io-client';

vi.mock('socket.io-client', () => {
  const mSocket = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    auth: {},
  };
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
});
