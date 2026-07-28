import React, { ReactElement } from 'react';
import { render, renderHook, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import type { Usuario } from './types';

interface MockAuthOptions {
  usuario?: Usuario | null;
  isAuthenticated?: boolean;
  login?: any;
  logout?: any;
}

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

interface CustomRenderOptions extends RenderOptions {
  route?: string;
  auth?: MockAuthOptions;
}

const mockNegocio = { id: 1, nombre: 'Negocio Test', plan: 'PRO' as const };

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', auth, ...options }: CustomRenderOptions = {}
) {
  const queryClient = createTestQueryClient();
  
  const defaultAuthValue = {
    usuario: null,
    negocio: mockNegocio,
    negocios: [mockNegocio],
    activeNegocioId: 1,
    token: 'test-token',
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    isAdmin: false,
    setFotoPerfil: vi.fn(),
    setNombre: vi.fn(),
    switchNegocio: vi.fn(),
    ...auth,
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={defaultAuthValue}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

export function renderHookWithProviders<Result, Props>(
  renderHookCallback: (initialProps: Props) => Result,
  { route = '/', auth, ...options }: CustomRenderOptions = {}
) {
  const queryClient = createTestQueryClient();
  
  const defaultAuthValue = {
    usuario: null,
    negocio: mockNegocio,
    negocios: [mockNegocio],
    activeNegocioId: 1,
    token: 'test-token',
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    isAdmin: false,
    setFotoPerfil: vi.fn(),
    setNombre: vi.fn(),
    switchNegocio: vi.fn(),
    ...auth,
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={defaultAuthValue}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return {
    ...renderHook(renderHookCallback, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}
