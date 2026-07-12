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
    token: string | null;
    loading: boolean;
    login: (token: string, usuario: Usuario, negocio: Negocio) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    setFotoPerfil: (url: string | null) => void;
    setNombre: (nombre: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [negocio, setNegocio] = useState<Negocio | null>(null);
    const [token, setToken] = useState<string | null>(auth.getToken());
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        auth.clearToken();
        setToken(null);
        setUsuario(null);
        setNegocio(null);
    }, []);

    const login = useCallback((newToken: string, newUser: Usuario, newNegocio: Negocio) => {
        auth.setToken(newToken);
        setToken(newToken);
        setUsuario(newUser);
        setNegocio(newNegocio);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const initAuth = async () => {
            const storedToken = auth.getToken();
            if (storedToken) {
                try {
                    const data = await api.me(storedToken);
                    if (!isMounted) return;
                    if (data) {
                        setUsuario({ id: data.usuario.id, nombre: data.usuario.nombre, email: data.usuario.email, rol: data.usuario.rol, fotoPerfil: data.usuario.fotoPerfil });
                        setNegocio(data.negocio || null);
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
        return () => { isMounted = false; };
    }, [logout]);

    const setFotoPerfil = useCallback((url: string | null) => {
        setUsuario(prev => prev ? { ...prev, fotoPerfil: url || undefined } : null);
    }, []);
    const setNombre = useCallback((nombre: string) => {
        setUsuario(prev => prev ? { ...prev, nombre } : null);
    }, []);

    const isAdmin = useMemo(() => usuario?.rol === 'ADMIN', [usuario]);

    const value = useMemo(() => ({
        usuario, negocio, token, loading,
        login, logout,
        isAuthenticated: !!usuario,
        isAdmin, setFotoPerfil, setNombre
    }), [usuario, negocio, token, loading, login, logout, isAdmin, setFotoPerfil, setNombre]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
