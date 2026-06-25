import { useAuthStore } from '../store/authStore';

export interface PrivateQueryOptions {
  enabled?: boolean;
}

export const usePrivateQueryEnabled = (enabled: boolean = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  return enabled && isAuthenticated && !isLoading && hasToken;
};
