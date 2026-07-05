import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthContext } from '../contexts/AuthContextValue';
import { useAuthStore } from '../../store/authStore';
import type { RoutePermission } from '../../config/protectedNavigation';
import { hasRequiredPermission } from '../../config/protectedNavigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permiso?: RoutePermission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permiso }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permiso) {
    const userPermisos = user?.permisos ?? [];
    if (!hasRequiredPermission(userPermisos, permiso)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
