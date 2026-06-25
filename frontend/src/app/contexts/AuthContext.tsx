import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/auth';
import { getFullImageUrl } from '../components/ui/utils';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: any | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user, isLoading, error } = useAuthStore();

  // Fetch current user on mount (if not authenticated yet but maybe session exists)
  useEffect(() => {
    const fetchMe = async () => {
      if (!isAuthenticated) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          useAuthStore.setState({ isLoading: false, isAuthenticated: false });
          return;
        }
        try {
          useAuthStore.setState({ isLoading: true });
          const res = await api.get('/auth/me');
          const backendUser = res.data;
          const user = {
            id: String(backendUser.idEmpleado),
            nombre: `${backendUser.nombre} ${backendUser.apellido || ''}`.trim(),
            email: backendUser.username,
            fotoUrl: getFullImageUrl(backendUser.avatarUrl),
            rol: backendUser.rol,
            permisos: backendUser.permisos || [],
          };
          useAuthStore.setState({
            user: user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (e) {
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    };
    fetchMe();
  }, []);

  const logout = async () => {
    await api.post('/auth/logout');
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        error,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
