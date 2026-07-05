import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { LoginForm } from '../components/auth/LoginForm';

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="theme-new min-h-screen bg-background flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
