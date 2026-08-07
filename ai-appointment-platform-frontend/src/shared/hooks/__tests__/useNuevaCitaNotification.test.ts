import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNuevaCitaNotification } from '../useNuevaCitaNotification';

const mockAddNotification = vi.fn();
const mockDismissNotification = vi.fn();
let capturedHandler: ((data: unknown) => void) | null = null;

vi.mock('../useNotifications', () => ({
  useNotifications: () => ({
    notifications: [{ id: '1', clienteNombre: 'Test', fecha: '01 ene 2026', horario: '10:00' }],
    addNotification: mockAddNotification,
    dismissNotification: mockDismissNotification,
  }),
}));

vi.mock('../useSocketEvent', () => ({
  useSocketEvent: (_event: string, handler: (data: unknown) => void) => {
    capturedHandler = handler;
  },
}));

vi.mock('../../utils/notificationSound', () => ({
  playNotificationSound: vi.fn(),
}));

import { playNotificationSound } from '../../utils/notificationSound';

describe('useNuevaCitaNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandler = null;
  });

  it('returns notifications and dismissNotification', () => {
    const { result } = renderHook(() => useNuevaCitaNotification());
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.dismissNotification).toBe(mockDismissNotification);
  });

  it('calls addNotification and playNotificationSound when nueva-cita fires', () => {
    renderHook(() => useNuevaCitaNotification());

    act(() => {
      capturedHandler?.({
        clienteNombre: 'María García',
        clienteTelefono: '+59160000001',
        fecha: '2026-08-10T14:00:00Z',
        horario: '14:00',
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteNombre: 'María García',
        horario: '14:00',
        message: 'Nueva cita de María García',
      }),
    );
    expect(playNotificationSound).toHaveBeenCalledTimes(1);
  });

  it('formats the date in Spanish locale', () => {
    renderHook(() => useNuevaCitaNotification());

    act(() => {
      capturedHandler?.({
        clienteNombre: 'Test',
        clienteTelefono: '+591',
        fecha: '2026-01-15T00:00:00Z',
        horario: '09:00',
      });
    });

    const call = mockAddNotification.mock.calls[0][0];
    expect(call.fecha).toMatch(/ene/i);
  });
});
