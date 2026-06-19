import { useQuery } from '@tanstack/react-query';
import { seguridadApi } from '../api/seguridad';

export const useSeguridad = () => {
  const sesionesQuery = useQuery({
    queryKey: ['sesiones-seguridad'],
    queryFn: seguridadApi.getSesiones,
  });

  return {
    sesiones: sesionesQuery.data || [],
    isLoading: sesionesQuery.isLoading,
    isError: sesionesQuery.isError,
  };
};
