import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    // You could render a loading spinner here
    return null;
  }

  if (!isAuthenticated) {
    // Preserve intended location for after login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
