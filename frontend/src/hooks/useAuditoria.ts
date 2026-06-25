import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../api/auditoria';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useAuditoria = ({ enabled = true }: PrivateQueryOptions = {}) => {
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const auditoriaQuery = useQuery({
    queryKey: ['auditoria'],
    queryFn: auditoriaApi.getAll,
    enabled: queryEnabled,
    staleTime: 30_000, // refresh every 30s
  });

  return {
    logs: auditoriaQuery.data || [],
    isLoading: auditoriaQuery.isLoading,
    isError: auditoriaQuery.isError,
    refetch: auditoriaQuery.refetch,
  };
};
