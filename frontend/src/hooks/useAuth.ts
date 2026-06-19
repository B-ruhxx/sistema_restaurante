// src/hooks/useAuth.ts
import { useCallback } from 'react';
import api from '../api/auth';
import { useAuthStore } from '../store/authStore';

interface LoginCredentials {
  username: string;
  password: string;
}

export const useAuth = () => {
  const login = useCallback(async (creds: LoginCredentials) => {
    useAuthStore.setState({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', creds);
      // Backend returns: { token, tokenType, user: { idEmpleado, nombre, apellido, username, rol, avatarUrl } }
      const { token, user: backendUser } = response.data;

      // Store JWT token for subsequent API calls
      localStorage.setItem('token', token);

      // Map backend user fields to our User interface
      const user = {
        id: String(backendUser.idEmpleado),
        nombre: `${backendUser.nombre} ${backendUser.apellido || ''}`.trim(),
        email: backendUser.username,
        fotoUrl: backendUser.avatarUrl
          ? backendUser.avatarUrl.startsWith('http')
            ? backendUser.avatarUrl
            : `http://localhost:8080${backendUser.avatarUrl}`
          : '',
        rol: backendUser.rol,
        permisos: backendUser.permisos || [],
      };

      useAuthStore.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (e: any) {
      useAuthStore.setState({
        isAuthenticated: false,
        isLoading: false,
        error: e.response?.data?.message || 'Usuario o contraseña incorrectos',
      });
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Error logging out from backend', e);
    } finally {
      localStorage.removeItem('token');
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const getCurrentUser = useCallback(() => useAuthStore.getState().user, []);

  return { login, logout, getCurrentUser };
};
