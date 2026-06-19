// src/store/authStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface User {
  id: string;
  nombre: string;
  fotoUrl: string;
  email: string;
  rol: string;
  permisos: string[]; // array of permission strings
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  setAuth: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  hasPermission: (permiso: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false, error: null }),
    setAuth: (isAuth) => set({ isAuthenticated: isAuth }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }),
    reset: () => set({ user: null, isAuthenticated: false, isLoading: false, error: null }),
    hasPermission: (permiso: string) => {
      const user = get().user;
      if (!user || !user.permisos) return false;
      return user.permisos.includes(permiso);
    },
  }))
);
