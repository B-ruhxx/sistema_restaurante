import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../api/auditoria';
import { PrivateQueryOptions, usePrivateQueryEnabled } from './usePrivateQuery';

export const useAuditoria = ({ enabled = true, tabla }: PrivateQueryOptions & { tabla?: string } = {}) => {
  const queryEnabled = usePrivateQueryEnabled(enabled);

  const auditoriaQuery = useQuery({
    queryKey: ['auditoria', tabla || 'all'],
    queryFn: () => tabla ? auditoriaApi.getByTabla(tabla) : auditoriaApi.getAll(),
    enabled: queryEnabled,
    staleTime: 30_000, // refresh every 30s
  });

  const tablasQuery = useQuery({
    queryKey: ['auditoria', 'all', 'tables'],
    queryFn: auditoriaApi.getAll,
    enabled: queryEnabled,
    staleTime: 60_000,
  });

  return {
    logs: auditoriaQuery.data || [],
    allLogs: tablasQuery.data || [],
    isLoading: auditoriaQuery.isLoading,
    isError: auditoriaQuery.isError,
    refetch: auditoriaQuery.refetch,
  };
};
