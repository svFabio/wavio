import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with an empty list when storage is empty', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
  });

  it('adds a notification with generated id and timestamp', () => {
    const { result } = renderHook(() => useNotifications());

    let notifId: string = '';
    act(() => {
      notifId = result.current.addNotification({
        message: 'Nueva cita',
        clienteNombre: 'Carlos',
        fecha: '2026-03-01',
        horario: '10:00',
      });
    });

    expect(notifId).toMatch(/^notif-/);
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      id: notifId,
      message: 'Nueva cita',
      clienteNombre: 'Carlos',
      fecha: '2026-03-01',
      horario: '10:00',
    });
    expect(typeof result.current.notifications[0].timestamp).toBe('number');
  });

  it('showNotification creates a notification with fallback empty details', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.showNotification('Operación exitosa', 'success');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Operación exitosa',
      clienteNombre: '',
      fecha: '',
      horario: '',
    });
  });

  it('dismisses a notification by id', () => {
    const { result } = renderHook(() => useNotifications());

    let id1: string = '';
    let id2: string = '';
    act(() => {
      id1 = result.current.addNotification({
        message: 'Cita 1',
        clienteNombre: 'Ana',
        fecha: '2026-03-01',
        horario: '09:00',
      });
      id2 = result.current.addNotification({
        message: 'Cita 2',
        clienteNombre: 'Beto',
        fecha: '2026-03-01',
        horario: '11:00',
      });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.dismissNotification(id1);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe(id2);
  });

  it('clears all notifications and removes them from session storage', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        message: 'Cita 1',
        clienteNombre: 'Ana',
        fecha: '2026-03-01',
        horario: '09:00',
      });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(sessionStorage.getItem('citas-notifications')).toBeNull();
  });

  it('loads existing notifications from session storage if valid', () => {
    const saved = [
      {
        id: 'notif-1',
        message: 'Stored notification',
        clienteNombre: 'Mario',
        fecha: '2026-03-01',
        horario: '15:00',
        timestamp: 123456789,
      },
    ];
    sessionStorage.setItem('citas-notifications', JSON.stringify(saved));

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual(saved);
  });

  it('handles corrupted JSON in storage gracefully', () => {
    sessionStorage.setItem('citas-notifications', 'invalid-json{');

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(sessionStorage.getItem('citas-notifications')).toBeNull();
  });

  it('handles storage errors without throwing when storage is blocked', () => {
    vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    vi.spyOn(sessionStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);

    expect(() => {
      act(() => {
        result.current.addNotification({
          message: 'Safe test',
          clienteNombre: 'Tester',
          fecha: '2026-03-01',
          horario: '10:00',
        });
      });
    }).not.toThrow();

    expect(result.current.notifications).toHaveLength(1);

    expect(() => {
      act(() => {
        result.current.clearAll();
      });
    }).not.toThrow();

    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears legacy zombie localStorage notifications on initialization without crashing if localStorage is blocked', () => {
    localStorage.setItem('citas-notifications', 'old-zombie-data');
    renderHook(() => useNotifications());
    expect(localStorage.getItem('citas-notifications')).toBeNull();

    // Verify when localStorage throws SecurityError
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(() => {
      renderHook(() => useNotifications());
    }).not.toThrow();
  });
});
