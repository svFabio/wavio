import React, { createContext, useContext, useState, useEffect } from 'react';
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

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const data = await api.me(storedToken);
                    if (data) {
                        setUsuario({ id: data.id, nombre: data.nombre, email: data.email, rol: data.rol });
                        setNegocio(data.negocio || null);
                        setToken(storedToken);
                    } else {
                        logout();
                    }
                } catch {
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = (newToken: string, newUser: Usuario, newNegocio: Negocio) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUsuario(newUser);
        setNegocio(newNegocio);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUsuario(null);
        setNegocio(null);
    };

    return (
        <AuthContext.Provider value={{
            usuario, negocio, token, loading,
            login, logout,
            isAuthenticated: !!usuario,
            isAdmin: () => usuario?.rol === 'ADMIN'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
