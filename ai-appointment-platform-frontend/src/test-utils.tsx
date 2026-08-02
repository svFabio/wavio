import React, { type ReactElement } from 'react';
import {
  render,
  renderHook,
  type RenderOptions,
  type RenderResult,
  type RenderHookResult,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';
import type { Negocio } from './features/auth/types';
import type { Usuario } from './types';

interface MockAuthOptions {
  usuario?: Usuario | null;
  isAuthenticated?: boolean;
  login?: (token: string, usuario: Usuario, negocios: Negocio[]) => void;
  logout?: () => void;
  negocio?: Negocio | null;
  negocios?: Negocio[];
  activeNegocioId?: number | null;
  token?: string | null;
  loading?: boolean;
  isAdmin?: boolean;
  setFotoPerfil?: (url: string | null) => void;
  setNombre?: (nombre: string) => void;
  switchNegocio?: (negocioId: number) => void;
}

export const createTestQueryClient = (): QueryClient =>
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

const mockNegocio: Negocio = { id: 1, nombre: 'Negocio Test', plan: 'PRO' };

function buildAuthValue(auth?: MockAuthOptions) {
  return {
    usuario: null as Usuario | null,
    negocio: mockNegocio as Negocio | null,
    negocios: [mockNegocio] as Negocio[],
    activeNegocioId: 1 as number | null,
    token: 'test-token' as string | null,
    loading: false,
    login: vi.fn() as unknown as (token: string, usuario: Usuario, negocios: Negocio[]) => void,
    logout: vi.fn() as unknown as () => void,
    isAuthenticated: false,
    isAdmin: false,
    setFotoPerfil: vi.fn() as unknown as (url: string | null) => void,
    setNombre: vi.fn() as unknown as (nombre: string) => void,
    switchNegocio: vi.fn() as unknown as (negocioId: number) => void,
    ...auth,
  };
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', auth, ...options }: CustomRenderOptions = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient();
  const authValue = buildAuthValue(auth);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
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
  { route = '/', auth, ...options }: CustomRenderOptions = {},
): RenderHookResult<Result, Props> & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient();
  const authValue = buildAuthValue(auth);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

  return {
    ...renderHook(renderHookCallback, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}
