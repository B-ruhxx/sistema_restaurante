import { useQuery } from '@tanstack/react-query';
import { permisosApi } from '../api/permisos';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const usePermisos = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const permisosQuery = useQuery({
    queryKey: ['permisos'],
    queryFn: permisosApi.getAll,
    enabled: queryEnabled,
    staleTime: 5 * 60_000,
  });

  return {
    permisos: permisosQuery.data || [],
    isLoading: permisosQuery.isLoading,
    isError: permisosQuery.isError,
  };
};
