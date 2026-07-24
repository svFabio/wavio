import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  login: (token: string, usuario: Usuario, negocios: Negocio[]) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setFotoPerfil: (url: string | null) => void;
  setNombre: (nombre: string) => void;
  switchNegocio: (negocioId: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const [activeNegocioId, setActiveNegocioId] = useState<number | null>(() => {
    return auth.getActiveNegocioId();
  });
  const [token, setToken] = useState<string | null>(auth.getToken());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
  });

  const usuario = data?.usuario || null;
  const negocios = data?.negocios || [];
  const loading = isLoading;

  const negocio = useMemo(
    () => negocios.find((n) => n.id === activeNegocioId) || null,
    [negocios, activeNegocioId],
  );

  const logout = useCallback(() => {
    auth.clearToken();
    auth.clearActiveNegocioId();
    setToken(null);
    queryClient.setQueryData(['me'], null);
    setActiveNegocioId(null);
  }, [queryClient]);

  const switchNegocio = useCallback(
    (negocioId: number) => {
      setActiveNegocioId(negocioId);
      auth.setActiveNegocioId(negocioId);
      queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const login = useCallback(
    (newToken: string, newUser: Usuario, newNegocios: Negocio[]) => {
      auth.setToken(newToken);
      setToken(newToken);
      queryClient.setQueryData(['me'], { usuario: newUser, negocios: newNegocios });

      if (newNegocios.length > 0) {
        const stored = auth.getActiveNegocioId();
        if (!stored || !newNegocios.find((n) => n.id === stored)) {
          setActiveNegocioId(newNegocios[0].id);
          auth.setActiveNegocioId(newNegocios[0].id);
        }
      } else {
        setActiveNegocioId(null);
        auth.clearActiveNegocioId();
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError, logout]);

  useEffect(() => {
    if (data?.negocios && data.negocios.length > 0) {
      const stored = auth.getActiveNegocioId();
      if (!stored || !data.negocios.find((n) => n.id === stored)) {
        setActiveNegocioId(data.negocios[0].id);
        auth.setActiveNegocioId(data.negocios[0].id);
      }
    }
  }, [data]);

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

  const isAdmin = useMemo(() => usuario?.rol === 'ADMIN', [usuario]);

  const value = useMemo(
    () => ({
      usuario,
      negocio,
      negocios,
      activeNegocioId,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!usuario,
      isAdmin,
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
      login,
      logout,
      isAdmin,
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
