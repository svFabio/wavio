import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocketEvent } from '../useSocketEvent';
import { auth } from '../../../lib/auth';

const mockSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  auth: {},
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../../../lib/auth', () => ({
  auth: {
    getToken: vi.fn(() => 'token-123'),
    getActiveNegocioId: vi.fn(() => 1),
  },
}));

describe('useSocketEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockSocket.auth = {};
    vi.mocked(auth.getToken).mockReturnValue('token-123');
    vi.mocked(auth.getActiveNegocioId).mockReturnValue(1);
  });

  it('attempts to connect when the first subscription mounts', () => {
    renderHook(() => useSocketEvent('nueva-cita', () => {}));

    expect(mockSocket.auth).toEqual({
      token: 'token-123',
      negocioId: 1,
    });
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('does not call connect again when the socket is already connected', () => {
    mockSocket.connected = true;

    renderHook(() => useSocketEvent('cambio-citas', () => {}));

    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('does not attempt to connect without an auth token but still subscribes', () => {
    vi.mocked(auth.getToken).mockReturnValueOnce(null);

    renderHook(() => useSocketEvent('nuevo-mensaje', () => {}));

    expect(mockSocket.connect).not.toHaveBeenCalled();
    expect(mockSocket.on).toHaveBeenCalledWith('nuevo-mensaje', expect.any(Function));
  });

  it('registers the handler after connecting and removes it on unmount without disconnecting', () => {
    const handler = (): void => {};

    const { unmount } = renderHook(() => useSocketEvent('conversacion-eliminada', handler));

    expect(mockSocket.on).toHaveBeenCalledWith('conversacion-eliminada', handler);

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('conversacion-eliminada', handler);
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
  });
});
