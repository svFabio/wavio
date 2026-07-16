import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { auth } from '../lib/auth';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'STAFF';
  fotoPerfil?: string;
}

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
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [activeNegocioId, setActiveNegocioId] = useState<number | null>(() => {
    return auth.getActiveNegocioId();
  });
  const [token, setToken] = useState<string | null>(auth.getToken());
  const [loading, setLoading] = useState(true);

  const negocio = useMemo(
    () => negocios.find((n) => n.id === activeNegocioId) || null,
    [negocios, activeNegocioId],
  );

  const logout = useCallback(() => {
    auth.clearToken();
    auth.clearActiveNegocioId();
    setToken(null);
    setUsuario(null);
    setNegocios([]);
    setActiveNegocioId(null);
  }, []);

  const switchNegocio = useCallback((negocioId: number) => {
    setActiveNegocioId(negocioId);
    auth.setActiveNegocioId(negocioId);
    window.location.reload();
  }, []);

  const login = useCallback((newToken: string, newUser: Usuario, newNegocios: Negocio[]) => {
    auth.setToken(newToken);
    setToken(newToken);
    setUsuario(newUser);
    setNegocios(newNegocios);

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
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = auth.getToken();
      if (storedToken) {
        try {
          const data = await api.me();
          if (!isMounted) return;
          if (data) {
            setUsuario({
              id: data.usuario.id,
              nombre: data.usuario.nombre,
              email: data.usuario.email,
              rol: data.usuario.rol,
              fotoPerfil: data.usuario.fotoPerfil,
            });
            setNegocios(data.negocios || []);
            if (data.negocios && data.negocios.length > 0) {
              const stored = auth.getActiveNegocioId();
              if (!stored || !data.negocios.find((n) => n.id === stored)) {
                setActiveNegocioId(data.negocios[0].id);
                auth.setActiveNegocioId(data.negocios[0].id);
              }
            } else {
              setActiveNegocioId(null);
              auth.clearActiveNegocioId();
            }
            setToken(storedToken);
          } else {
            logout();
          }
        } catch {
          if (isMounted) logout();
        }
      }
      if (isMounted) setLoading(false);
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, [logout]);

  const setFotoPerfil = useCallback((url: string | null) => {
    setUsuario((prev) => (prev ? { ...prev, fotoPerfil: url || undefined } : null));
  }, []);
  const setNombre = useCallback((nombre: string) => {
    setUsuario((prev) => (prev ? { ...prev, nombre } : null));
  }, []);

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
