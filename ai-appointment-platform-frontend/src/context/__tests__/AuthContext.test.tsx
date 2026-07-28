import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { auth } from '../../lib/auth';
import { server } from '../../test-setup';
import { http, HttpResponse } from 'msw';

vi.mock('../../lib/auth', () => ({
  auth: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    getActiveNegocioId: vi.fn(),
    setActiveNegocioId: vi.fn(),
    clearActiveNegocioId: vi.fn()
  }
}));

describe('AuthContext', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  it('initializes without user when token is missing', () => {
    vi.mocked(auth.getToken).mockReturnValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.usuario).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('fetches user when token is present', async () => {
    vi.mocked(auth.getToken).mockReturnValue('valid-token');
    
    server.use(
      http.get('*/api/v1/auth/me', () => {
        return HttpResponse.json({
          usuario: { id: 1, nombre: 'Test', rol: 'ADMIN' },
          negocios: [{ id: 1, nombre: 'Test Negocio', plan: 'PRO' }]
        });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usuario?.nombre).toBe('Test');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('handles login properly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.login(
        'new-token',
        { id: 2, nombre: 'New User', email: 'a@b.com', rol: 'STAFF' },
        [{ id: 2, nombre: 'Negocio 2', plan: 'FREE' }]
      );
    });

    expect(auth.setToken).toHaveBeenCalledWith('new-token');
    expect(auth.setActiveNegocioId).toHaveBeenCalledWith(2);
    expect(result.current.usuario?.nombre).toBe('New User');
    expect(result.current.negocio?.id).toBe(2);
  });

  it('handles logout properly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.logout();
    });

    expect(auth.clearToken).toHaveBeenCalled();
    expect(auth.clearActiveNegocioId).toHaveBeenCalled();
    expect(result.current.usuario).toBeNull();
  });
});
