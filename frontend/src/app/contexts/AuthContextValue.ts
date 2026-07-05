import { createContext, useContext } from 'react';
import type { User } from '../../store/authStore';

export interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
