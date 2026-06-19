import { useQuery } from '@tanstack/react-query';
import { permisosApi } from '../api/permisos';

export const usePermisos = () => {
  const permisosQuery = useQuery({
    queryKey: ['permisos'],
    queryFn: permisosApi.getAll,
  });

  return {
    permisos: permisosQuery.data || [],
    isLoading: permisosQuery.isLoading,
    isError: permisosQuery.isError,
  };
};
