import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
    isActive: boolean;
    avatar?: string;
    preferences?: {
        notifications?: {
            email?: boolean;
            inApp?: boolean;
        };
    };
}

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    register: (userData: unknown) => Promise<any>;
    logout: () => Promise<void>;
    updateProfile: (updates: unknown) => Promise<any>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkLoggedIn();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        setUser(res.data.user);
        return res.data;
    };

    const register = async (userData: unknown) => {
        const res = await api.post('/auth/register', userData);
        setUser(res.data.user);
        return res.data;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    const updateProfile = async (updates: unknown) => {
        const res = await api.put('/auth/me', updates);
        setUser(res.data.user);
        return res.data;
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        const res = await api.put('/auth/change-password', { currentPassword, newPassword });
        setUser(res.data.user);
        return res.data;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
