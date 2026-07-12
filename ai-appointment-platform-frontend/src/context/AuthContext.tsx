import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';

interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'STAFF';
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
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [negocio, setNegocio] = useState<Negocio | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUsuario(null);
        setNegocio(null);
    }, []);

    const login = useCallback((newToken: string, newUser: Usuario, newNegocio: Negocio) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUsuario(newUser);
        setNegocio(newNegocio);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const data = await api.me(storedToken);
                    if (!isMounted) return;
                    if (data) {
                        setUsuario({ id: data.id, nombre: data.nombre, email: data.email, rol: data.rol });
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

    const isAdmin = useCallback(() => usuario?.rol === 'ADMIN', [usuario]);

    const value = useMemo(() => ({
        usuario, negocio, token, loading,
        login, logout,
        isAuthenticated: !!usuario,
        isAdmin,
    }), [usuario, negocio, token, loading, login, logout, isAdmin]);

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
