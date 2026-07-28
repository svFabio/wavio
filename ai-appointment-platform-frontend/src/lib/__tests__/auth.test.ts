import { describe, it, expect, beforeEach } from 'vitest';
import { auth } from '../auth';

describe('auth helper', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
