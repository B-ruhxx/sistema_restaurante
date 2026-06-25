import { useQuery } from '@tanstack/react-query';
import { seguridadApi } from '../api/seguridad';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useSeguridad = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const sesionesQuery = useQuery({
    queryKey: ['sesiones-seguridad'],
    queryFn: seguridadApi.getSesiones,
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  return {
    sesiones: sesionesQuery.data || [],
    isLoading: sesionesQuery.isLoading,
    isError: sesionesQuery.isError,
  };
};
