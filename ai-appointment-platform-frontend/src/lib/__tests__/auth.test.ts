import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { auth } from '../auth';

describe('auth helper', () => {
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    localStorage.clear();
    auth.clearToken();
    auth.clearActiveNegocioId();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  });

  it('gets and sets token', () => {
    expect(auth.getToken()).toBeNull();
    auth.setToken('test-token');
    expect(auth.getToken()).toBe('test-token');
  });

  it('clears token', () => {
    auth.setToken('test-token');
    auth.clearToken();
    expect(auth.getToken()).toBeNull();
  });

  it('checks authentication status', () => {
    expect(auth.isAuthenticated()).toBe(false);
    auth.setToken('test-token');
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('gets and sets active negocio id', () => {
    expect(auth.getActiveNegocioId()).toBeNull();
    auth.setActiveNegocioId(1);
    expect(auth.getActiveNegocioId()).toBe(1);
  });

  it('clears active negocio id', () => {
    auth.setActiveNegocioId(1);
    auth.clearActiveNegocioId();
    expect(auth.getActiveNegocioId()).toBeNull();
  });

  it('handles in-memory fallback when window.localStorage is undefined', () => {
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(auth.getToken()).toBeNull();
    expect(auth.getActiveNegocioId()).toBeNull();

    auth.setToken('fallback-token');
    expect(auth.getToken()).toBe('fallback-token');
    expect(auth.isAuthenticated()).toBe(true);

    auth.setActiveNegocioId(99);
    expect(auth.getActiveNegocioId()).toBe(99);

    auth.clearToken();
    expect(auth.getToken()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);

    auth.clearActiveNegocioId();
    expect(auth.getActiveNegocioId()).toBeNull();
  });

  it('handles in-memory fallback when window.localStorage access throws an error', () => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('SecurityError: Access is denied', 'SecurityError');
      },
      configurable: true,
    });

    expect(() => auth.getToken()).not.toThrow();
    expect(auth.getToken()).toBeNull();

    expect(() => auth.setToken('token-under-security-error')).not.toThrow();
    expect(auth.getToken()).toBe('token-under-security-error');

    expect(() => auth.setActiveNegocioId(123)).not.toThrow();
    expect(auth.getActiveNegocioId()).toBe(123);

    expect(() => auth.clearToken()).not.toThrow();
    expect(auth.getToken()).toBeNull();

    expect(() => auth.clearActiveNegocioId()).not.toThrow();
    expect(auth.getActiveNegocioId()).toBeNull();
  });

  it('handles errors when localStorage methods throw', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Read failed', 'SecurityError');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
      throw new DOMException('Remove failed', 'SecurityError');
    });

    expect(() => auth.setToken('quota-token')).not.toThrow();
    expect(auth.getToken()).toBe('quota-token');

    expect(() => auth.setActiveNegocioId(77)).not.toThrow();
    expect(auth.getActiveNegocioId()).toBe(77);

    expect(() => auth.clearToken()).not.toThrow();
    expect(auth.getToken()).toBeNull();

    expect(() => auth.clearActiveNegocioId()).not.toThrow();
    expect(auth.getActiveNegocioId()).toBeNull();
  });

  it('returns null for non-numeric activeNegocioId in storage', () => {
    localStorage.setItem('activeNegocioId', 'not-a-number');
    expect(auth.getActiveNegocioId()).toBeNull();
  });
});
