import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '../api/auditoria';

export const useAuditoria = () => {
  const auditoriaQuery = useQuery({
    queryKey: ['auditoria'],
    queryFn: auditoriaApi.getAll,
    staleTime: 30_000, // refresh every 30s
  });

  return {
    logs: auditoriaQuery.data || [],
    isLoading: auditoriaQuery.isLoading,
    isError: auditoriaQuery.isError,
    refetch: auditoriaQuery.refetch,
  };
};
