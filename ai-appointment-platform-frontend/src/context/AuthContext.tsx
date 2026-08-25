import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../features/auth/api/auth.api';
import { auth } from '../lib/auth';
import type { Usuario } from '../types';

interface Negocio {
  id: number;
  nombre: string;
  plan: 'FREE' | 'PRO';
}

interface AuthContextType {
  usuario: Usuario | null;
  negocio: Negocio | null;
  negocios: Negocio[];
  activeNegocioId: number | null;
  token: string | null;
  loading: boolean;
  isError: boolean;
  refetchUser: () => void;
  login: (token: string, usuario: Usuario, negocios: Negocio[]) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  setFotoPerfil: (url: string | null) => void;
  setNombre: (nombre: string) => void;
  switchNegocio: (negocioId: number) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [localActiveId, setLocalActiveId] = useState<number | null>(() =>
    auth.getActiveNegocioId(),
  );
  const [localToken, setLocalToken] = useState<string | null>(() => auth.getToken());

  useEffect(() => {
    const handleUnauthorized = () => {
      setLocalToken(null);
      setLocalActiveId(null);
      queryClient.setQueryData(['me'], null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [queryClient]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const result = await authApi.me();
      if (!result) {
        auth.clearToken();
        auth.clearActiveNegocioId();
        setLocalToken(null);
        setLocalActiveId(null);
        return null;
      }
      return result;
    },
    enabled: !!localToken,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const usuario = isError ? null : data?.usuario || null;
  const negocios = isError ? [] : data?.negocios || [];
  const loading = isLoading;
  const token = isError ? null : localToken;

  useEffect(() => {
    if (negocios.length > 0) {
      const stored = auth.getActiveNegocioId();
      const found = stored && negocios.some((n) => n.id === stored);
      const targetId = found ? stored : negocios[0].id;
      if (stored !== targetId || localActiveId !== targetId) {
        auth.setActiveNegocioId(targetId);
        setLocalActiveId(targetId);
      }
    }
  }, [negocios, localActiveId]);

  const activeNegocioId = useMemo(() => {
    if (!negocios || negocios.length === 0) return null;
    const found = localActiveId && negocios.find((n) => n.id === localActiveId);
    if (found) return localActiveId;
    return negocios[0].id;
  }, [negocios, localActiveId]);

  const negocio = useMemo(
    () => negocios.find((n) => n.id === activeNegocioId) || null,
    [negocios, activeNegocioId],
  );

  const logout = useCallback(() => {
    auth.clearToken();
    auth.clearActiveNegocioId();
    setLocalToken(null);
    queryClient.setQueryData(['me'], null);
    setLocalActiveId(null);
  }, [queryClient]);

  const switchNegocio = useCallback(
    (negocioId: number) => {
      setLocalActiveId(negocioId);
      auth.setActiveNegocioId(negocioId);
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const refetchUser = useCallback(() => {
    refetch();
  }, [refetch]);

  const login = useCallback(
    (newToken: string, newUser: Usuario, newNegocios: Negocio[]) => {
      auth.setToken(newToken);
      setLocalToken(newToken);
      queryClient.setQueryData(['me'], { usuario: newUser, negocios: newNegocios });

      if (newNegocios.length > 0) {
        const stored = auth.getActiveNegocioId();
        if (!stored || !newNegocios.find((n) => n.id === stored)) {
          setLocalActiveId(newNegocios[0].id);
          auth.setActiveNegocioId(newNegocios[0].id);
        } else {
          setLocalActiveId(stored);
        }
      } else {
        setLocalActiveId(null);
        auth.clearActiveNegocioId();
      }
    },
    [queryClient],
  );

  const setFotoPerfil = useCallback(
    (url: string | null) => {
      queryClient.setQueryData(
        ['me'],
        (old: { usuario: Usuario; negocios: Negocio[] } | undefined) =>
          old ? { ...old, usuario: { ...old.usuario, fotoPerfil: url || undefined } } : old,
      );
    },
    [queryClient],
  );

  const setNombre = useCallback(
    (nombre: string) => {
      queryClient.setQueryData(
        ['me'],
        (old: { usuario: Usuario; negocios: Negocio[] } | undefined) =>
          old ? { ...old, usuario: { ...old.usuario, nombre } } : old,
      );
    },
    [queryClient],
  );

  const isOwner = useMemo(() => usuario?.rol === 'OWNER', [usuario]);
  const isAdmin = useMemo(() => usuario?.rol === 'ADMIN' || usuario?.rol === 'OWNER', [usuario]);

  const value = useMemo(
    () => ({
      usuario,
      negocio,
      negocios,
      activeNegocioId,
      token,
      loading,
      isError,
      refetchUser,
      login,
      logout,
      isAuthenticated: !!usuario,
      isAdmin,
      isOwner,
      setFotoPerfil,
      setNombre,
      switchNegocio,
    }),
    [
      usuario,
      negocio,
      negocios,
      activeNegocioId,
      token,
      loading,
      isError,
      refetchUser,
      login,
      logout,
      isAdmin,
      isOwner,
      setFotoPerfil,
      setNombre,
      switchNegocio,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
